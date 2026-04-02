import MainLayout from '../layouts/MainLayout.js?v=24';
import SearchInput from '../components/SearchInput.js?v=2';
import DataTable from '../components/DataTable.js?v=11';
import ActionDropdown from '../components/ActionDropdown.js?v=2';
import Modal from '../components/Modal.js?v=2';
import FormInput from '../components/FormInput.js?v=2';
import { fetchApi } from '../utils/api.js?v=4';

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
        return {
            searchQuery: '',
            showModal: false,
            editingUser: null,
            loading: false,
            error: null,
            columns: [
                { key: 'username', label: 'USERNAME', sortable: true, thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'role_label', label: 'ROLES', align: 'center' },
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
                country_code: '62',
                phone_number: '',
                role_id: null,
                password: '',
                is_active: 1
            },
            countryCodes: [
                { code: '62', name: 'Indonesia', flag: '🇮🇩' },
                { code: '60', name: 'Malaysia', flag: '🇲🇾' },
                { code: '65', name: 'Singapore', flag: '🇸🇬' },
                { code: '66', name: 'Thailand', flag: '🇹🇭' },
                { code: '84', name: 'Vietnam', flag: '🇻🇳' },
                { code: '63', name: 'Philippines', flag: '🇵🇭' },
                { code: '1', name: 'USA/Canada', flag: '🇺🇸' },
                { code: '44', name: 'UK', flag: '🇬🇧' },
                { code: '61', name: 'Australia', flag: '🇦🇺' },
                { code: '81', name: 'Japan', flag: '🇯🇵' },
                { code: '82', name: 'South Korea', flag: '🇰🇷' },
                { code: '86', name: 'China', flag: '🇨🇳' }
            ]
        }
    },
    computed: {
        filteredUsers() {
            if (!this.searchQuery) return this.admins;
            const query = this.searchQuery.toLowerCase();
            return this.admins.filter(user =>
                user.username?.toLowerCase().includes(query) ||
                user.role_label?.toLowerCase().includes(query)
            );
        }
    },
    mounted() {
        this.fetchAdmins();
        this.fetchRoles();
    },
    methods: {
        async fetchAdmins() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetchApi('/admins');
                this.admins = response.data || [];
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
                this.roles = response.data || [];
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
                country_code: '62',
                phone_number: '',
                role_id: this.roles.find(r => r.name === 'admin')?.id || this.roles[0]?.id || null, 
                password: '',
                is_active: 1
            };
            this.showModal = true;
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
                country_code: countryCode,
                phone_number: phoneNumber,
                role_id: user.role_id, 
                password: '',
                is_active: user.is_active ?? 1
            };
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.editingUser = null;
            this.formData = { username: '', country_code: '62', phone_number: '', role_id: null, password: '', is_active: 1 };
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
            } catch (err) {
                console.error(`Failed to ${this.editingUser ? 'update' : 'create'} admin:`, err);
                alert(`Failed to ${this.editingUser ? 'update' : 'create'} admin: ` + (err.message || 'Unknown error'));
            } finally {
                this.submitting = false;
            }
        },
        async deleteAdmin(user) {
            if (confirm(`Are you sure you want to delete ${user.username}?`)) {
                try {
                    await fetchApi(`/admins/${user.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchAdmins();
                } catch (err) {
                    console.error('Failed to delete admin:', err);
                    alert('Failed to delete admin: ' + (err.message || 'Unknown error'));
                }
            }
        },
        async saveResetPassword() {
            if (this.submitting) return;
            if (!this.resetPasswordData.password) {
                alert('Please enter a new password');
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
                alert('Password reset successfully');
                this.closeResetModal();
            } catch (err) {
                console.error('Failed to reset password:', err);
                alert('Failed to reset password: ' + (err.message || 'Unknown error'));
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
                alert('Role updated successfully');
                this.closeRoleModal();
                await this.fetchAdmins();
            } catch (err) {
                console.error('Failed to update role:', err);
                alert('Failed to update role: ' + (err.message || 'Unknown error'));
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
                    <div class="flex items-center gap-4"> 
                        <!-- Search Input -->
                        <SearchInput v-model="searchQuery" placeholder="Search" />
                    </div>

                    <!-- Add Button -->
                    <button 
                        @click="openAddModal"
                        class="p-3 bg-[#39DEBB] text-white rounded-lg hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30"
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
                       
                        
                        <div class="mb-5">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span class="text-red-500">*</span>
                            </label>
                            <div class="flex gap-2">
                                <select 
                                    v-model="formData.country_code"
                                    class="w-32 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option v-for="cc in countryCodes" :key="cc.code" :value="cc.code">
                                        {{ cc.flag }} +{{ cc.code }}
                                    </option>
                                </select>
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
