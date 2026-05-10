import MainLayout from '../layouts/MainLayout.js?v=25';
import SearchInput from '../components/SearchInput.js?v=2';
import DataTable from '../components/DataTable.js?v=34';
import ActionDropdown from '../components/ActionDropdown.js?v=2';
import Modal from '../components/Modal.js?v=2';
import FormInput from '../components/FormInput.js?v=2';
import { fetchApi } from '../utils/api.js?v=4';
import { encryptQuery, decryptQuery } from '../utils/crypto.js?v=1';
import { countryCodes } from '../data/country.js';

export default {
    name: 'AccessManagement',
    components: {
        MainLayout,
        SearchInput,
        DataTable,
        ActionDropdown,
        Modal,
        FormInput
    },
    data() {
        const query = decryptQuery(this.$route.query);
        return {
            searchQuery: query.search || '',
            showActiveOnly: query.is_active !== undefined ? parseInt(query.is_active) : 1,
            showModal: false,
            editingUser: null,
            loading: false,
            error: null,
            columns: [
                { key: 'username', label: 'USERNAME', sortable: true, thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'moonbot_username', label: 'MOONBOT USERNAME', sortable: true },
                { key: 'role_label', label: 'ROLES', align: 'center' },
                { key: 'is_active', label: 'STATUS', align: 'center' },
                { key: 'last_login', label: 'LAST LOGIN', sortable: true }
            ],
            actions: [
                { key: 'edit', label: 'Edit User', color: 'blue' },
                { key: 'changeRole', label: 'Change Role', color: 'purple' },
                { key: 'resetPassword', label: 'Reset Password', color: 'yellow' },
                { key: 'delete', label: 'Delete User', color: 'red' }
            ],
            admins: [],
            roles: [],
            submitting: false,
            showResetModal: false,
            resetUser: null,
            showRoleModal: false,
            roleUser: null,
            roleData: {
                role_id: null
            },
            resetPasswordData: {
                password: ''
            },
            formData: {
                username: '',
                moonbot_username: '',
                country_code: '62',
                phone_number: '',
                role_id: null,
                password: '',
                is_active: 1
            },
            moonbotUserSearch: '',
            moonbotUserOptions: [],
            isSearchingMoonbotUsers: false,
            showMoonbotUserDropdown: false,
            moonbotSearchTimeout: null,
            moonbotUserStartPage: 1,
            moonbotUserEndPage: 1,
            moonbotUserTotalPages: 1,
            isLoadingMoreMoonbotUsers: false,
            isLoadingPrevMoonbotUsers: false,
            countryCodes: countryCodes,
            showCountryDropdown: false,
            countrySearch: ''
        }
    },
    computed: {
        selectedCountryFlag() {
            const country = this.countryCodes.find(c => c.code === this.formData.country_code);
            return country ? country.flag : '🏳️';
        },
        filteredCountryCodes() {
            if (!this.countrySearch) return this.countryCodes;
            const s = this.countrySearch.toLowerCase();
            return this.countryCodes.filter(c => 
                c.name.toLowerCase().includes(s) || c.code.includes(s)
            );
        },
        filteredUsers() {
            const admins = Array.isArray(this.admins) ? this.admins : [];
            if (!this.searchQuery) return admins;
            const query = this.searchQuery.toLowerCase();
            return admins.filter(user =>
                user.username?.toLowerCase().includes(query) ||
                user.moonbot_username?.toLowerCase().includes(query) ||
                user.role_label?.toLowerCase().includes(query)
            );
        }
    },
    watch: {
        searchQuery() {
            this.syncQueryParams();
        },
        showActiveOnly() {
            this.syncQueryParams();
            this.fetchAdmins();
        },
        moonbotUserSearch(newVal) {
            // Ignore if it matches the form data (selected)
            if (this.formData.moonbot_username === newVal) return;
            
            // Sync form data with raw input
            this.formData.moonbot_username = newVal;
            
            clearTimeout(this.moonbotSearchTimeout);
            this.moonbotSearchTimeout = setTimeout(() => {
                this.fetchMoonbotUsers(newVal || '', null, true);
            }, 500);
        }
    },
    mounted() {
        this.fetchAdmins();
        this.fetchRoles();
    },
    methods: {
        async fetchMoonbotUsers(search, direction = null, showDropdown = false) {
            if (this.isLoadingMoreMoonbotUsers || this.isLoadingPrevMoonbotUsers || this.isSearchingMoonbotUsers) return;

            let targetPage = 1;

            if (direction === 'next') {
                this.isLoadingMoreMoonbotUsers = true;
                targetPage = this.moonbotUserEndPage + 1;
            } else if (direction === 'prev') {
                this.isLoadingPrevMoonbotUsers = true;
                targetPage = this.moonbotUserStartPage - 1;
            } else {
                this.isSearchingMoonbotUsers = true;
                this.moonbotUserStartPage = 1;
                this.moonbotUserEndPage = 1;
                targetPage = 1;
            }

            try {
                const response = await fetchApi(`/moonbot-users?search=${encodeURIComponent(search)}&page=${targetPage}&limit=25`);
                const responseData = response.data || {};
                const items = Array.isArray(responseData) ? responseData : (responseData.users || responseData.data || []);
                const newOptions = items.map(i => i.username || i.moonbot_username || i);
                
                if (responseData.pagination) {
                    this.moonbotUserTotalPages = responseData.pagination.total_pages;
                }

                if (direction === 'next') {
                    this.moonbotUserOptions = [...this.moonbotUserOptions, ...newOptions];
                    this.moonbotUserEndPage = targetPage;
                    
                    if (this.moonbotUserOptions.length > 75) {
                        this.moonbotUserOptions = this.moonbotUserOptions.slice(-75);
                        this.moonbotUserStartPage++;
                        // Adjust scroll position after DOM updates
                        this.$nextTick(() => {
                            const container = this.$refs.moonbotDropdownContainer;
                            if (container) container.scrollTop -= (25 * 37); // Approx height of 25 items
                        });
                    }
                } else if (direction === 'prev') {
                    this.moonbotUserOptions = [...newOptions, ...this.moonbotUserOptions];
                    this.moonbotUserStartPage = targetPage;
                    
                    if (this.moonbotUserOptions.length > 75) {
                        this.moonbotUserOptions = this.moonbotUserOptions.slice(0, 75);
                        this.moonbotUserEndPage--;
                    }
                    
                    // Adjust scroll position so user doesn't jump to the top
                    this.$nextTick(() => {
                        const container = this.$refs.moonbotDropdownContainer;
                        if (container) container.scrollTop += (25 * 37); // Approx height of 25 items
                    });
                } else {
                    this.moonbotUserOptions = newOptions;
                }
                
                if (showDropdown) {
                    this.showMoonbotUserDropdown = true;
                }
            } catch (err) {
                console.error('Failed to fetch moonbot users:', err);
                if (!direction) this.moonbotUserOptions = [];
            } finally {
                this.isSearchingMoonbotUsers = false;
                this.isLoadingMoreMoonbotUsers = false;
                this.isLoadingPrevMoonbotUsers = false;
            }
        },
        handleMoonbotUserScroll(e) {
            const container = e.target;
            const bottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
            const top = container.scrollTop < 10;
            
            if (bottom && this.moonbotUserEndPage < this.moonbotUserTotalPages) {
                this.fetchMoonbotUsers(this.moonbotUserSearch, 'next');
            } else if (top && this.moonbotUserStartPage > 1) {
                this.fetchMoonbotUsers(this.moonbotUserSearch, 'prev');
            }
        },
        handleMoonbotUserBlur() {
            setTimeout(() => {
                this.showMoonbotUserDropdown = false;
            }, 200);
        },
        selectCountry(code) {
            this.formData.country_code = code;
            this.showCountryDropdown = false;
            this.countrySearch = '';
        },
        handleCountryBlur() {
            setTimeout(() => {
                this.showCountryDropdown = false;
                this.countrySearch = '';
            }, 200);
        },
        selectMoonbotUser(username) {
            this.formData.moonbot_username = username;
            this.moonbotUserSearch = username;
            this.showMoonbotUserDropdown = false;
        },
        async fetchAdmins() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetchApi(`/admins?is_active=${this.showActiveOnly}`);
                this.admins = Array.isArray(response.data) ? response.data : (response.data?.admins || []);
            } catch (err) {
                console.error('Failed to fetch admins:', err);
                this.error = 'Failed to load administrative users.';
            } finally {
                this.loading = false;
            }
        },
        async fetchRoles() {
            try {
                const response = await fetchApi('/roles');
                this.roles = (response.data || []).filter(r => (r.name || '').toLowerCase().replace(/\s/g, '') !== 'superadmin');
                // Set default role if available
                if (this.roles.length > 0 && !this.formData.role_id) {
                    const adminRole = this.roles.find(r => r.name === 'admin');
                    this.formData.role_id = adminRole ? adminRole.id : this.roles[0].id;
                }
            } catch (err) {
                console.error('Failed to fetch roles:', err);
            }
        },
        formatDate(dateString) {
            if (!dateString) return 'Never';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            } catch (e) {
                return dateString;
            }
        },
        getRoleBadgeClass(role) {
            switch (role?.toLowerCase()) {
                case 'super admin':
                case 'superadmin':
                    return 'bg-cyan-100 text-cyan-700';
                case 'admin':
                    return 'bg-purple-100 text-purple-700';
                case 'leader':
                    return 'bg-yellow-100 text-yellow-700';
                default:
                    return 'bg-gray-100 text-gray-700';
            }
        },
        getRoleDotClass(role) {
            switch (role?.toLowerCase()) {
                case 'super admin':
                case 'superadmin': return 'bg-cyan-500';
                case 'admin': return 'bg-purple-500';
                case 'leader': return 'bg-yellow-500';
                default: return 'bg-gray-500';
            }
        },
        openAddModal() {
            this.editingUser = null;
            this.formData = { 
                username: '', 
                moonbot_username: '',
                country_code: '62',
                phone_number: '',
                role_id: this.roles.find(r => r.name === 'admin')?.id || this.roles[0]?.id || null, 
                password: '',
                is_active: 1
            };
            this.moonbotUserSearch = '';
            this.showModal = true;
            this.fetchMoonbotUsers('', null, false);
        },
        openEditModal(user) {
            this.editingUser = user;
            let countryCode = '62';
            let phoneNumber = user.phone || '';
            
            // Try to match country code from the beginning of the phone string
            if (phoneNumber) {
                const sortedCodes = [...this.countryCodes].sort((a, b) => b.code.length - a.code.length);
                for (const cc of sortedCodes) {
                    if (phoneNumber.startsWith(cc.code)) {
                        countryCode = cc.code;
                        phoneNumber = phoneNumber.substring(cc.code.length);
                        break;
                    }
                }
            }

            this.formData = { 
                username: user.username, 
                moonbot_username: user.moonbot_username || '',
                country_code: countryCode,
                phone_number: phoneNumber,
                role_id: user.role_id, 
                password: '',
                is_active: user.is_active ?? 1
            };
            this.moonbotUserSearch = user.moonbot_username || '';
            this.showModal = true;
            this.fetchMoonbotUsers(this.moonbotUserSearch, null, false);
        },
        closeModal() {
            this.showModal = false;
            this.editingUser = null;
            this.formData = { username: '', moonbot_username: '', country_code: '62', phone_number: '', role_id: null, password: '', is_active: 1 };
            this.moonbotUserSearch = '';
        },
        openResetModal(user) {
            this.resetUser = user;
            this.resetPasswordData.password = '';
            this.showResetModal = true;
        },
        closeResetModal() {
            this.showResetModal = false;
            this.resetUser = null;
            this.resetPasswordData.password = '';
        },
        openRoleModal(user) {
            this.roleUser = user;
            this.roleData.role_id = user.role_id;
            this.showRoleModal = true;
        },
        closeRoleModal() {
            this.showRoleModal = false;
            this.roleUser = null;
            this.roleData.role_id = null;
        },
        async saveUser() {
            if (this.submitting) return;

            this.submitting = true;
            try {
                const isEditing = !!this.editingUser;
                const path = isEditing ? `/admins/${this.editingUser.id}` : '/admins';
                const method = isEditing ? 'PUT' : 'POST';
                
                const body = {
                    username: this.formData.username,
                    moonbot_username: this.formData.moonbot_username,
                    phone: `${this.formData.country_code}${this.formData.phone_number}`,
                    role_id: this.formData.role_id,
                    is_active: this.formData.is_active
                };

                // Add password only for new users or if explicitly changed
                if (!isEditing || this.formData.password) {
                    body.password = this.formData.password;
                }

                await fetchApi(path, {
                    method: method,
                    body: body
                });

                this.closeModal();
                await this.fetchAdmins();
                Swal.fire({
                    title: 'Success',
                    text: `Admin ${isEditing ? 'updated' : 'created'} successfully`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error(`Failed to ${this.editingUser ? 'update' : 'create'} admin:`, err);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to ${this.editingUser ? 'update' : 'create'} admin: ` + (err.message || 'Unknown error'),
                    icon: 'error'
                });
            } finally {
                this.submitting = false;
            }
        },
        async deleteAdmin(user) {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You want to delete ${user.username}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#39DEBB',
                cancelButtonColor: '#f3f4f6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: '!text-white',
                    cancelButton: '!text-gray-700'
                }
            });

            if (result.isConfirmed) {
                try {
                    await fetchApi(`/admins/${user.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchAdmins();
                    Swal.fire({
                        title: 'Deleted',
                        text: 'Admin has been deleted successfully',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error('Failed to delete admin:', err);
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to delete admin: ' + (err.message || 'Unknown error'),
                        icon: 'error'
                    });
                }
            }
        },
        async saveResetPassword() {
            if (this.submitting) return;
            if (!this.resetPasswordData.password) {
                Swal.fire({
                    title: 'Warning',
                    text: 'Please enter a new password',
                    icon: 'warning'
                });
                return;
            }

            this.submitting = true;
            try {
                await fetchApi(`/admins/${this.resetUser.id}/reset-password`, {
                    method: 'PUT',
                    body: {
                        password: this.resetPasswordData.password
                    }
                });
                Swal.fire({
                    title: 'Success',
                    text: 'Password reset successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                this.closeResetModal();
            } catch (err) {
                console.error('Failed to reset password:', err);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to reset password: ' + (err.message || 'Unknown error'),
                    icon: 'error'
                });
            } finally {
                this.submitting = false;
            }
        },
        async saveRoleUpdate() {
            if (this.submitting) return;
            
            this.submitting = true;
            try {
                await fetchApi(`/admins/${this.roleUser.id}/role`, {
                    method: 'PUT',
                    body: {
                        role_id: this.roleData.role_id
                    }
                });
                Swal.fire({
                    title: 'Success',
                    text: 'Role updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                this.closeRoleModal();
                await this.fetchAdmins();
            } catch (err) {
                console.error('Failed to update role:', err);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update role: ' + (err.message || 'Unknown error'),
                    icon: 'error'
                });
            } finally {
                this.submitting = false;
            }
        },
        handleAction({ action, row }) {
            switch (action) {
                case 'edit':
                    this.openEditModal(row);
                    break;
                case 'changeRole':
                    this.openRoleModal(row);
                    break;
                case 'resetPassword':
                    this.openResetModal(row);
                    break;
                case 'delete':
                    this.deleteAdmin(row);
                    break;
            }
        },
        async toggleStatus(user) {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You want to ${user.is_active ? 'deactivate' : 'activate'} ${user.username}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#39DEBB',
                cancelButtonColor: '#f3f4f6',
                confirmButtonText: 'Yes, change it!',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: '!text-white',
                    cancelButton: '!text-gray-700'
                }
            });

            if (!result.isConfirmed) return;

            try {
                const newStatus = user.is_active ? 0 : 1;
                
                await fetchApi(`/admins/${user.id}`, {
                    method: 'PUT',
                    body: {
                        username: user.username,
                        moonbot_username: user.moonbot_username,
                        phone: user.phone,
                        role_id: user.role_id,
                        is_active: newStatus
                    }
                });

                Swal.fire({
                    title: 'Success',
                    text: 'Status updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                await this.fetchAdmins();
            } catch (err) {
                console.error('Failed to toggle status:', err);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update status: ' + (err.message || 'Unknown error'),
                    icon: 'error'
                });
                await this.fetchAdmins();
            }
        },
        syncQueryParams() {
            const query = {};
            if (this.searchQuery) query.search = this.searchQuery;
            query.is_active = this.showActiveOnly;
            this.$router.replace({ query: encryptQuery(query) }).catch(() => {});
        }
    },
    template: `
        <MainLayout>
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">Access Management</h1>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Toolbar -->
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-4 w-full md:w-auto"> 
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search Username/Email" width="w-full" class="h-full border-gray-200" />
                        </div>
                        <div class="h-11 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 shadow-sm">
                            <label class="flex items-center cursor-pointer m-0 mb-0">
                                <div class="relative flex items-center">
                                    <input type="checkbox" :checked="showActiveOnly === 1" @change="showActiveOnly = $event.target.checked ? 1 : 0" class="sr-only">
                                    <div class="block w-9 h-5 rounded-full transition-colors duration-200 ease-in-out" :class="showActiveOnly === 1 ? 'bg-[#39DEBB]' : 'bg-gray-200'"></div>
                                    <div class="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out transform shadow-sm" :class="showActiveOnly === 1 ? 'translate-x-4' : 'translate-x-0'"></div>
                                </div>
                                <span class="ml-2 text-xs font-medium text-gray-700 whitespace-nowrap">Active Only</span>
                            </label>
                        </div>
                    </div>

                    <!-- Add Button -->
                    <button 
                        @click="openAddModal"
                        class="p-3 bg-[#39DEBB] text-white rounded-lg hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading administrative users...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ error }}</span>
                    <button @click="fetchAdmins" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <!-- Data Table -->
                <DataTable 
                    v-else
                    :columns="columns" 
                    :data="filteredUsers"
                    :show-actions="true"
                >
                    <!-- Custom role cell -->
                    <template #cell-role_label="{ value }">
                        <span :class="['inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', getRoleBadgeClass(value)]">
                            <span :class="['w-2 h-2 rounded-full mr-2', getRoleDotClass(value)]"></span>
                            {{ value }}
                        </span>
                    </template>

                    <!-- Custom username cell -->
                    <template #cell-username="{ value }">
                        <span class="font-medium text-gray-900">{{ value }}</span>
                    </template>

                    <!-- Custom last login cell -->
                    <template #cell-last_login="{ value }">
                        <span class="text-gray-500">{{ formatDate(value) }}</span>
                    </template>

                    <!-- Custom status cell -->
                    <template #cell-is_active="{ row, value }">
                        <div class="flex items-center justify-center gap-3">
                            <button 
                                @click.stop="toggleStatus(row)"
                                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                :class="value ? 'bg-[#39DEBB]' : 'bg-gray-200'"
                            >
                                <span 
                                    aria-hidden="true" 
                                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                    :class="value ? 'translate-x-4' : 'translate-x-0'"
                                ></span>
                            </button>
                            <span :class="['text-[10px] font-bold uppercase tracking-wider min-w-[50px] text-left', value ? 'text-teal-600' : 'text-gray-400']">
                                {{ value ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                    </template>

                    <!-- Row actions -->
                    <template #row-actions="{ row }">
                        <ActionDropdown 
                            :actions="actions" 
                            :row="row" 
                            @action="handleAction"
                        />
                    </template>
                </DataTable>
            </div>
            <!-- Modal -->
            <Modal 
                :show="showModal" 
                :title="editingUser ? 'Edit user' : 'Add new user'"
                @close="closeModal"
            >
                <form @submit.prevent="saveUser">
                    <div class="space-y-4">
                        <FormInput 
                            v-model="formData.username"
                            label="Username"
                            :required="true"
                        />
                        
                        <!-- Moonbot Username Autocomplete -->
                        <div class="relative mb-5">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Moonbot Username
                            </label>
                            <input 
                                v-model="moonbotUserSearch"
                                @focus="fetchMoonbotUsers(moonbotUserSearch || '', null, true)"
                                @blur="handleMoonbotUserBlur"
                                type="text"
                                placeholder="Search moonbot username..."
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            
                            <!-- Dropdown -->
                            <div 
                                v-if="showMoonbotUserDropdown || isSearchingMoonbotUsers" 
                                ref="moonbotDropdownContainer"
                                class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
                                @scroll="handleMoonbotUserScroll"
                            >
                                <div v-if="isSearchingMoonbotUsers" class="px-4 py-3 text-sm text-gray-500 flex justify-center">
                                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#39DEBB]"></div>
                                </div>
                                <div v-else-if="moonbotUserOptions.length === 0" class="px-4 py-3 text-sm text-gray-500">
                                    No users found
                                </div>
                                <ul v-else class="py-1">
                                    <li v-if="isLoadingPrevMoonbotUsers" class="px-4 py-3 flex justify-center">
                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-[#39DEBB]"></div>
                                    </li>
                                    <li 
                                        v-for="(opt, idx) in moonbotUserOptions" 
                                        :key="idx"
                                        @click="selectMoonbotUser(opt)"
                                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        {{ opt }}
                                    </li>
                                    <li v-if="isLoadingMoreMoonbotUsers" class="px-4 py-3 flex justify-center">
                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-[#39DEBB]"></div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                       
                        
                        <div class="mb-5">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span class="text-red-500">*</span>
                            </label>
                            <div class="flex gap-2">
                                <!-- Custom Country Searchable Select -->
                                <div class="relative w-32 shrink-0">
                                    <div 
                                        @click="showCountryDropdown = !showCountryDropdown; if(showCountryDropdown) $nextTick(() => $refs.countrySearchInput && $refs.countrySearchInput.focus())"
                                        class="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <span class="truncate flex items-center gap-1">
                                            <span>{{ selectedCountryFlag }}</span>
                                            <span>+{{ formData.country_code }}</span>
                                        </span>
                                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                    
                                    <!-- Dropdown -->
                                    <div 
                                        v-if="showCountryDropdown" 
                                        class="absolute z-50 w-64 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 left-0"
                                    >
                                        <div class="p-2 border-b border-gray-100">
                                            <input 
                                                ref="countrySearchInput"
                                                v-model="countrySearch"
                                                @blur="handleCountryBlur"
                                                type="text"
                                                placeholder="Search country..."
                                                class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <ul class="max-h-48 overflow-y-auto py-1">
                                            <li v-if="filteredCountryCodes.length === 0" class="px-4 py-2 text-sm text-gray-500 text-center">
                                                No results found
                                            </li>
                                            <li 
                                                v-for="cc in filteredCountryCodes" 
                                                :key="cc.name"
                                                @click="selectCountry(cc.code)"
                                                class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                            >
                                                <span class="text-base">{{ cc.flag }}</span>
                                                <span class="font-medium">+{{ cc.code }}</span>
                                                <span class="text-gray-500 text-xs truncate">{{ cc.name }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <input 
                                    v-model="formData.phone_number"
                                    type="text"
                                    required
                                    placeholder="812345678"
                                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Roles Toggle (Only for Add) -->
                    <div class="mt-5 mb-5" v-if="!editingUser">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Roles<span class="text-red-500">*</span>
                        </label>
                        <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                            <button 
                                v-for="(role, index) in roles"
                                :key="role.id"
                                type="button"
                                @click="formData.role_id = role.id"
                                :class="[
                                    'px-4 py-2 text-sm font-medium transition-colors',
                                    index !== roles.length - 1 ? 'border-r border-gray-200' : '',
                                    formData.role_id === role.id 
                                        ? 'bg-white text-teal-600' 
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                ]"
                            >
                                {{ role.label }}
                            </button>
                        </div>
                    </div>

                     

                    <FormInput 
                        v-if="!editingUser"
                        v-model="formData.password"
                        label="Password"
                        type="password"
                        :required="!editingUser"
                    />

                    <!-- Buttons -->
                    <div class="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            @click="closeModal"
                            class="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            :disabled="submitting"
                            class="px-6 py-2.5 bg-[#39DEBB] rounded-lg text-sm font-medium text-white hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                        >
                            <span v-if="submitting">Saving...</span>
                            <span v-else>{{ editingUser ? 'Save Changes' : 'Add User' }}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <!-- Reset Password Modal -->
            <Modal 
                :show="showResetModal" 
                :title="'Reset password for ' + (resetUser?.username || '')"
                @close="closeResetModal"
            >
                <form @submit.prevent="saveResetPassword">
                    <FormInput 
                        v-model="resetPasswordData.password"
                        label="New Password"
                        type="password"
                        :required="true"
                        placeholder="Enter new password"
                    />

                    <!-- Buttons -->
                    <div class="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            @click="closeResetModal"
                            class="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            :disabled="submitting"
                            class="px-6 py-2.5 bg-[#39DEBB] rounded-lg text-sm font-medium text-white hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                        >
                            <span v-if="submitting">Resetting...</span>
                            <span v-else>Reset Password</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <!-- Change Role Modal -->
            <Modal 
                :show="showRoleModal" 
                :title="'Change role for ' + (roleUser?.username || '')"
                @close="closeRoleModal"
            >
                <form @submit.prevent="saveRoleUpdate">
                    <div class="mb-5">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Select New Role<span class="text-red-500">*</span>
                        </label>
                        <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                            <button 
                                v-for="(role, index) in roles"
                                :key="role.id"
                                type="button"
                                @click="roleData.role_id = role.id"
                                :class="[
                                    'px-4 py-2 text-sm font-medium transition-colors',
                                    index !== roles.length - 1 ? 'border-r border-gray-200' : '',
                                    roleData.role_id === role.id 
                                        ? 'bg-white text-teal-600' 
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                ]"
                            >
                                {{ role.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Buttons -->
                    <div class="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            @click="closeRoleModal"
                            class="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            :disabled="submitting"
                            class="px-6 py-2.5 bg-[#39DEBB] rounded-lg text-sm font-medium text-white hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                        >
                            <span v-if="submitting">Updating...</span>
                            <span v-else>Update Role</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    `
}
