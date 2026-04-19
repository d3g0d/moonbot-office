import MainLayout from '../layouts/MainLayout.js?v=25';
import DataTable from '../components/DataTable.js?v=34';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=4';
import { formatRank, formatPercentWithDays, formatNumber } from '../utils/formatters.js';
import { fetchApi, BASE_URL } from '../utils/api.js?v=4';

export default {
    name: 'PipelineDrilldown',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        FilterDropdown
    },
    data() {
        const query = this.$route.query;
        return {
            selectedLeader: query.leader || '',
            filters: {
                month: query.month || new Date().toISOString().slice(0, 7)
            },
            drilldownSearchQuery: '',
            drilldownLoading: false,
            drilldownError: null,
            isFilterOpen: false,
            activeFilters: {},
            lastUpdated: 'Live Stats',
            drilldownData: [],
            drilldownSummary: {
                total: 0,
                activate: 0,
                api_bind: 0,
                credit: 0,
                bot_run: 0
            },
            drilldownPagination: {
                page: 1,
                limit: 50,
                totalItems: 0,
                totalPages: 0
            },
            drilldownSort: {
                sortBy: query.sort_by || '',
                sortDir: query.sort_dir || 'desc'
            },
            drilldownColumns: [
                { key: 'username', label: 'USERNAME', sortable: true , thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'PAKET', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'join_date', label: 'TGL JOIN', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'activate', label: 'ACTIVATE', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'api_bind', label: 'API BIND', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'credit', label: 'CREDIT', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'bot_run', label: 'BOT RUN', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'days_from_join', label: 'HARI DARI JOIN', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'upper_upline', label: 'UPLINE RANK 6', sortable: true, align: 'center', colWidth: '150px' },
                { key: 'upline', label: 'UPLINE RANK 3', sortable: true, align: 'center', colWidth: '150px' },
                { key: 'msisdn', label: 'NO HP', sortable: true, align: 'center', colWidth: '150px' }
            ]
        }
    },
    computed: {
        filterSchema() {
            return [
                {
                    type: 'radio-group',
                    label: 'VIP Plan',
                    key: 'vipPlan',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'B+', value: '1' },
                        { label: 'A+', value: '2' },
                        { label: 'P+', value: '3' }
                    ]
                },
                {
                    type: 'radio-group',
                    label: 'Activate',
                    key: 'activate',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Done', value: '1' },
                        { label: 'Not Done', value: '0' }
                    ]
                },
                {
                    type: 'radio-group',
                    label: 'API Bind',
                    key: 'api_bind',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Done', value: '1' },
                        { label: 'Not Done', value: '0' }
                    ]
                },
                {
                    type: 'radio-group',
                    label: 'Credit',
                    key: 'credit',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Done', value: '1' },
                        { label: 'Not Done', value: '0' }
                    ]
                },
                {
                    type: 'radio-group',
                    label: 'Bot Run',
                    key: 'bot_run',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Done', value: '1' },
                        { label: 'Not Done', value: '0' }
                    ]
                },
                {
                    type: 'text',
                    label: 'Upline Rank 3',
                    key: 'upline',
                    placeholder: 'Username'
                },
                {
                    type: 'text',
                    label: 'Upline Rank 6',
                    key: 'upper_upline',
                    placeholder: 'Username'
                }
            ];
        }
    },
    mounted() {
        if (!this.selectedLeader) {
            this.$router.push('/pipeline');
            return;
        }
        this.fetchDrilldown();
    },
    methods: {
        formatRank,
        formatPercentWithDays,
        formatNumber,
        formatVipLevel(value) {
            if (value === 0 || value === 1) return 'B+';
            if (value === 2) return 'A+';
            if (value === 3) return 'P+';
            return value || '-';
        },
        handleDrilldownPageChange({ page, rowsPerPage }) {
            this.drilldownPagination.page = page;
            this.drilldownPagination.limit = rowsPerPage;
            this.fetchDrilldown();
        },
        handleDrilldownSortChange({ key, order }) {
            this.drilldownSort.sortBy = key;
            this.drilldownSort.sortDir = order;
            this.drilldownPagination.page = 1;
            this.fetchDrilldown();
        },
        async fetchDrilldown() {
            this.drilldownLoading = true;
            this.drilldownError = null;
            try {
                const params = new URLSearchParams({
                    leader: this.selectedLeader,
                    page: this.drilldownPagination.page,
                    limit: this.drilldownPagination.limit
                });

                if (this.filters.month) {
                    const [year, month] = this.filters.month.split('-');
                    params.append('join_month', parseInt(month).toString());
                    params.append('join_year', year);
                }
                
                if (this.activeFilters.vipPlan) {
                    params.append('plan', this.activeFilters.vipPlan);
                }

                ['activate', 'api_bind', 'credit', 'bot_run'].forEach(key => {
                    if (this.activeFilters[key] !== undefined && this.activeFilters[key] !== null && this.activeFilters[key] !== '') {
                        params.append(key, this.activeFilters[key]);
                    }
                });

                if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
                if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

                if (this.drilldownSearchQuery) {
                    params.append('search', this.drilldownSearchQuery);
                }

                if (this.drilldownSort.sortBy) {
                    params.append('sort_by', this.drilldownSort.sortBy);
                    params.append('sort_dir', this.drilldownSort.sortDir || 'desc');
                }

                const response = await fetchApi(`/pipeline/drilldown?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.drilldownData = (data.users || []).map((item, index) => ({
                        id: (this.drilldownPagination.page - 1) * this.drilldownPagination.limit + index + 1,
                        ...item,
                        upper_upline: item.upper_upline || '-',
                        upline: item.upline || '-'
                    }));
                    if (data.summary) {
                         const snap = data.summary
                         this.drilldownSummary = {
                             total: snap.total_users||0,
                             activate: snap.activate_count || 0,
                             api_bind: snap.api_bind_count || 0,
                             credit: snap.credit_count || 0,
                             bot_run: snap.bot_run_count || 0
                         };
                    }
                    if (data.pagination) {
                        this.drilldownPagination.totalItems = data.pagination.total || 0;
                        this.drilldownPagination.totalPages = data.pagination.total_pages || 0;
                        this.drilldownPagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pipeline drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
            } finally {
                this.drilldownLoading = false;
            }
        },
        formatDate(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            } catch (e) {
                return dateString;
            }
        },
        goBack() {
            this.$router.push('/pipeline');
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        applyFilters() {
            this.drilldownPagination.page = 1;
            this.fetchDrilldown();
            this.isFilterOpen = false;
        },
        async handleExport() {
            const params = new URLSearchParams({
                leader: this.selectedLeader,
                search: this.drilldownSearchQuery || ''
            });

            if (this.activeFilters.vipPlan) params.append('plan', this.activeFilters.vipPlan);

            if (this.filters.month) {
                const [year, month] = this.filters.month.split('-');
                params.append('join_month', parseInt(month).toString());
                params.append('join_year', year);
            }

            ['activate', 'api_bind', 'credit', 'bot_run'].forEach(key => {
                if (this.activeFilters[key] !== undefined && this.activeFilters[key] !== null && this.activeFilters[key] !== '') {
                    params.append(key, this.activeFilters[key]);
                }
            });

            if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
            if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

            const token = localStorage.getItem('moon_office_token');
            const url = `${BASE_URL}/pipeline/drilldown/export?${params.toString()}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Export failed');

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                const filename = `Drilldown_Pipeline_${this.selectedLeader}_${this.filters.month || 'all'}.csv`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error('Export error:', error);
                alert('Gagal mendownload data export.');
            }
        }
    },
    watch: {
        drilldownSearchQuery() {
            clearTimeout(this.drilldownSearchTimeout);
            this.drilldownSearchTimeout = setTimeout(() => {
                this.drilldownPagination.page = 1;
                this.fetchDrilldown();
            }, 500);
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Pipeline Drilldown</h1>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-400">
                <div class="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4">
                    <button @click="goBack" class="p-1 hover:bg-gray-100 rounded text-[#00A3FF]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 class="text-lg font-bold text-gray-800">
                        Drilldown Summary - {{ selectedLeader }}
                    </h2>
                </div>

                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                    <div class="flex flex-wrap items-center gap-2 w-full md:w-auto relative">
                        <div class="relative">
                            <button @click="toggleFilter" class="filter-trigger h-10 w-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none relative z-20">
                                <img src="./assets/images/icons/filter.svg" alt="Filter" class="h-4 w-4">
                            </button>
                            <filter-dropdown :is-open="isFilterOpen" :schema="filterSchema" v-model="activeFilters" @close="isFilterOpen = false" @apply="applyFilters"></filter-dropdown>
                        </div>
                        <div class="w-full md:w-64 h-10">
                            <SearchInput v-model="drilldownSearchQuery" placeholder="Search" width="w-full" class="h-full border-gray-200 text-sm" />
                        </div>
                    </div>
                    <button @click="handleExport" class="text-gray-400 hover:text-gray-600" title="Export Drilldown">
                        <img src="./assets/images/icons/download.svg" alt="Download" class="h-5 w-5">
                    </button>
                </div>

                <div v-if="drilldownLoading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                </div>

                <div v-else-if="drilldownError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ drilldownError }}</span>
                    <button @click="fetchDrilldown" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <div v-else class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <DataTable 
                        key="drilldown-table"
                        :columns="drilldownColumns" 
                        :data="drilldownData"
                        server-side
                        :total-items="drilldownPagination.totalItems"
                        :total-pages="drilldownPagination.totalPages"
                        :current-page="drilldownPagination.page"
                        :default-rows-per-page="drilldownPagination.limit"
                        :sort-by="drilldownSort.sortBy"
                        :sort-order="drilldownSort.sortDir"
                        @page-change="handleDrilldownPageChange"
                        @sort-change="handleDrilldownSortChange"
                    >
                        <template #action-header><th></th></template>
                        <template #row-actions></template>
                        
                        <template #table-prepend>
                            <tr class="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-900 text-xs text-center">
                                <td class="px-3 md:px-4 py-2.5 text-left"></td>
                                <td class="sticky left-0 bg-white z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words py-2.5 text-left">
                                    {{ formatNumber(drilldownSummary.total) }} User
                                </td>
                                <td class="px-4 py-2.5 w-[100px] min-w-[100px]"></td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px]"></td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px] text-center">{{ formatNumber(drilldownSummary.activate) }} User</td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px] text-center">{{ formatNumber(drilldownSummary.api_bind) }} User</td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px] text-center">{{ formatNumber(drilldownSummary.credit) }} User</td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px] text-center">{{ formatNumber(drilldownSummary.bot_run) }} User</td>
                                <td class="px-4 py-2.5 w-[120px] min-w-[120px]"></td>
                                <td class="px-4 py-2.5 w-[150px] min-w-[150px]"></td>
                                <td class="px-4 py-2.5 w-[150px] min-w-[150px]"></td>
                                <td class="px-4 py-2.5 w-[150px] min-w-[150px]"></td>
                            </tr>
                        </template>

                        <template #cell-username="{ value }">
                            <a href="#" @click.prevent class="text-[#00A3FF] hover:text-[#0084CC] font-medium no-underline cursor-pointer">{{ value || '-' }}</a>
                        </template>

                        <template #cell-vip_level="{ value }">
                            <div class="flex justify-center">
                                <span class="font-medium text-gray-900">{{ formatVipLevel(value) }}</span>
                            </div>
                        </template>
                        
                        <template #cell-join_date="{ value }">
                            <div class="flex justify-center">
                                <span class="font-medium text-gray-900">{{ formatDate(value) }}</span>
                            </div>
                        </template>
                        
                        <template #cell-days_from_join="{ value }">
                            <div class="flex justify-center">
                                <span class="font-medium text-gray-900">{{ value !== null && value !== undefined ? value + ' days' : '-' }}</span>
                            </div>
                        </template>

                        <template #cell-activate="{ value }">
                            <div class="flex justify-center">
                                <span v-if="value" class="bg-[#22C55E] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span v-else class="bg-[#EF4444] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                        </template>
                        <template #cell-api_bind="{ value }">
                            <div class="flex justify-center">
                                <span v-if="value" class="bg-[#22C55E] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span v-else class="bg-[#EF4444] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                        </template>
                        <template #cell-credit="{ value }">
                            <div class="flex justify-center">
                                <span v-if="value" class="bg-[#22C55E] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span v-else class="bg-[#EF4444] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                        </template>
                        <template #cell-bot_run="{ value }">
                            <div class="flex justify-center">
                                <span v-if="value" class="bg-[#22C55E] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span v-else class="bg-[#EF4444] text-white p-0.5 rounded shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                        </template>
                    </DataTable>
                </div>
            </div>
        </MainLayout>
    `
};
