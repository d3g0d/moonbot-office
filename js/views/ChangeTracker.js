import MainLayout from '../layouts/MainLayout.js?v=26';
import DataTable from '../components/DataTable.js?v=35';
import SearchInput from '../components/SearchInput.js';
import DatePicker from '../components/DatePicker.js?v=3';
import { fetchApi } from '../utils/api.js?v=5';
import { formatNumber, formatRank, leaderRankLabels } from '../utils/formatters.js?v=4';
import { encryptQuery, decryptQuery } from '../utils/crypto.js?v=2';

export default {
    name: 'ChangeTracker',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        DatePicker
    },
    data() {
        const query = decryptQuery(this.$route.query);
        let leaderValue = query.leader || 'All';
        return {
            loading: false,
            error: null,
            filters: {
                month: query.month || new Date().toISOString().slice(0, 7), // YYYY-MM
                leader: leaderValue,
                vipPlan: query.vipPlan || 'All'
            },
            monthPickerConfig: {
                plugins: [
                    (typeof monthSelectPlugin !== 'undefined' || (typeof flatpickr !== 'undefined' && flatpickr.plugins && flatpickr.plugins.monthSelect)) ? 
                    new (monthSelectPlugin || flatpickr.plugins.monthSelect)({
                        shorthand: true,
                        dateFormat: "Y-m",
                        altFormat: "M Y",
                        theme: "light"
                    }) : null
                ].filter(Boolean)
            },
            searchQuery: '',
            internalSearchQuery: query.search || '',
            trackerData: [],
            monthLabels: [],
            pagination: {
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 25,
                totalItems: 0,
                totalPages: 0
            },
            sort: {
                sortBy: query.sort_by || 'increment_0',
                sortDir: query.sort_dir || 'desc'
            },
            leaderRankLabels
        }
    },
    computed: {
        columns() {
            const labels = this.monthLabels.length === 4 ? this.monthLabels : [];
            
            const getMonthName = (dateStr) => {
                if (!dateStr) return '';
                const [y, m] = dateStr.split('-');
                return new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
            };

            const baseLabel = labels[0] ? `CONVERSION BOT RUN (${getMonthName(labels[0])})` : 'CONVERSION BOT RUN';
            const incLabel1 = labels[1] ? `+${getMonthName(labels[1])}` : 'N+1';
            const incLabel2 = labels[2] ? `+${getMonthName(labels[2])}` : 'N+2';
            const incLabel3 = labels[3] ? `+${getMonthName(labels[3])}` : 'N+3';

            return [
                { 
                    key: 'leader', 
                    label: 'LEADER', 
                    sortable: true,
                    thClass: 'sticky top-0 left-0 bg-white z-40 whitespace-nowrap !px-4 md:!px-6 min-w-[140px]',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 whitespace-nowrap !px-4 md:!px-6 min-w-[140px]'
                },
                { key: 'total_join', label: 'TOTAL JOIN', sortable: true, align: 'center' },
                { key: 'base_bot_run_pct', label: baseLabel, sortable: true, align: 'center' },
                { key: 'increment_0', label: incLabel1, sortable: true, align: 'center' },
                { key: 'increment_1', label: incLabel2, sortable: true, align: 'center' },
                { key: 'increment_2', label: incLabel3, sortable: true, align: 'center' },
                { key: 'cumulative_pct', label: 'CUMULATIVE', sortable: true, align: 'center' }
            ];
        }
    },
    watch: {
        filters: {
            handler() {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchChangeTracker();
            },
            deep: true
        },
        internalSearchQuery(newVal) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchChangeTracker();
            }, 500);
        }
    },
    mounted() {
        this.fetchChangeTracker();
    },
    methods: {
        formatNumber,
        formatRank,
        async fetchChangeTracker() {
            this.loading = true;
            this.error = null;
            try {
                const [year, month] = this.filters.month.split('-');
                const params = new URLSearchParams({
                    month: parseInt(month).toString(),
                    year: year,
                    page: this.pagination.page,
                    limit: this.pagination.limit,
                    sort_by: this.sort.sortBy || '',
                    sort_dir: this.sort.sortDir || 'desc'
                });

                if (this.internalSearchQuery) {
                    params.append('exact_leader', this.internalSearchQuery);
                }

                if (this.filters.leader && this.filters.leader !== 'All') {
                    params.append('rank', this.filters.leader);
                }

                const response = await fetchApi(`/pipeline/change-tracker?${params.toString()}`);
                if (response.success && response.data) {
                    this.monthLabels = response.data.month_labels || [];
                    this.trackerData = (response.data.leaders || []).map((item, index) => ({
                        id: index + 1,
                        ...item
                    }));
                    if (response.data.pagination) {
                        this.pagination.totalItems = response.data.pagination.total || 0;
                        this.pagination.totalPages = response.data.pagination.total_pages || 0;
                        this.pagination.page = response.data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch change tracker:', err);
                this.error = 'Failed to load change tracker data.';
            } finally {
                this.loading = false;
            }
        },
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.syncQueryParams();
            this.fetchChangeTracker();
        },
        handleSortChange({ key, order }) {
            this.sort.sortBy = key;
            this.sort.sortDir = order;
            this.pagination.page = 1;
            this.syncQueryParams();
            this.fetchChangeTracker();
        },
        syncQueryParams() {
            const query = {};
            if (this.filters.leader && this.filters.leader !== 'All') {
                query.leader = this.filters.leader;
            }
            if (this.filters.vipPlan && this.filters.vipPlan !== 'All') query.vipPlan = this.filters.vipPlan;
            if (this.filters.month) query.month = this.filters.month;
            if (this.sort.sortBy && this.sort.sortBy !== 'increment_0') query.sort_by = this.sort.sortBy;
            if (this.sort.sortDir && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.sort.sortBy === 'increment_0' && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.pagination.page > 1) query.page = this.pagination.page;
            if (this.pagination.limit !== 25) query.limit = this.pagination.limit;
            if (this.internalSearchQuery) query.search = this.internalSearchQuery;
            
            this.$router.replace({ query: encryptQuery(query) }).catch(() => {});
        },
        getBotRunClass(value) {
            const val = parseFloat(value);
            if (isNaN(val)) return 'px-2 py-1 bg-gray-100 text-gray-400 rounded-lg font-bold min-w-[60px] inline-block text-center';
            if (val > 85) return 'px-2 py-1 bg-[#22C55E] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm';
            if (val >= 60) return 'px-2 py-1 bg-[#F9B33F] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm';
            return 'px-2 py-1 bg-[#EF4444] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm';
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Change Tracker</h1>
            </div>            <div class="flex flex-wrap items-center gap-3 mb-8">
                <!-- Month Filter -->
                <div class="relative w-full sm:w-auto">
                    <DatePicker v-model="filters.month" :config="monthPickerConfig">
                        <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                            <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Month:</span>
                            <span class="px-4 pb-2 sm:py-2 sm:pl-2 pr-12 text-sm font-medium min-w-[120px] leading-relaxed">{{ filters.month || 'Select Month' }}</span>
                            <div class="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 flex items-center px-4 text-gray-700">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </DatePicker>
                </div>
 
                <!-- Leader Filter -->
                <div class="relative w-full sm:w-auto">
                    <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                        <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Leader :</span>
                        <select v-model="filters.leader" class="appearance-none bg-transparent px-4 pb-2 sm:py-2 sm:pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                            <option value="All">All</option>
                            <option v-for="n in 11" :key="n" :value="n">{{ leaderRankLabels[n] }}</option>
                        </select>
                        <div class="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 flex items-center px-4 text-gray-700">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
           <!-- Table Card -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                 <!-- Data Table Toolbar (Internal Search) -->
                 <div class="flex flex-wrap md:flex-nowrap justify-start items-center mb-6">
                    <div class="w-full md:w-64 h-11 relative">
                        <SearchInput v-model="internalSearchQuery" placeholder="Exact Leader" width="w-full" class="h-full border-gray-200 text-sm" />
                    </div>
                </div>

                <div class="bg-white">
                    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF] mb-4"></div>
                        <p class="text-gray-500 text-sm">Loading tracker data...</p>
                    </div>

                    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <span>{{ error }}</span>
                        <button @click="fetchChangeTracker" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                    </div>

                    <DataTable 
                        v-else
                        :columns="columns" 
                        :data="trackerData"
                        server-side
                        :total-items="pagination.totalItems"
                        :total-pages="pagination.totalPages"
                        :current-page="pagination.page"
                        :default-rows-per-page="pagination.limit"
                        :sort-by="sort.sortBy"
                        :sort-order="sort.sortDir"
                        @page-change="handlePageChange"
                        @sort-change="handleSortChange"
                    >
                        <!-- Hide ACTION column header & cells -->
                        <template #action-header><th></th></template>
                        <template #row-actions></template>

                        <!-- Custom cell styling for # ID -->
                        <template #cell-id="{ value }">
                            <span class="text-gray-500 font-medium whitespace-nowrap px-2">{{ value }}</span>
                        </template>
                        
                        <!-- Custom Leader styling -->
                        <template #cell-leader="{ value }">
                            <span class="text-[#0088cc] font-medium">
                                {{ value }}
                            </span>
                        </template>
                        
                        <!-- Base Conversion styling -->
                        <template #cell-base_bot_run_pct="{ value }">
                            <div class="flex justify-center">
                                <span :class="getBotRunClass(value)">{{ value !== null ? value + '%' : '0%' }}</span>
                            </div>
                        </template>

                        <!-- Increment slots -->
                        <template #cell-increment_0="{ row }">
                            <span class="text-gray-900 font-medium">
                                {{ row.increments && row.increments[0] ? row.increments[0].pct + '%' : '0%' }}
                            </span>
                        </template>

                        <template #cell-increment_1="{ row }">
                            <span class="text-gray-900 font-medium">
                                {{ row.increments && row.increments[1] ? row.increments[1].pct + '%' : '0%' }}
                            </span>
                        </template>

                        <template #cell-increment_2="{ row }">
                            <span class="text-gray-900 font-medium">
                                {{ row.increments && row.increments[2] ? row.increments[2].pct + '%' : '0%' }}
                            </span>
                        </template>

                        <template #cell-cumulative_pct="{ value }">
                            <div class="flex justify-center">
                                <span :class="getBotRunClass(value)">{{ value !== null ? value + '%' : '0%' }}</span>
                            </div>
                        </template>

                        <template #cell-total_join="{ value }">
                            <span class="text-gray-900 font-medium">{{ value !== null && value !== undefined ? formatNumber(value) : '-' }}</span>
                        </template>
                    </DataTable>
                    
                    <div class="flex justify-end mt-2 text-xs text-gray-500">
                        Live Stats
                    </div>
                </div>
            </div>
        </MainLayout>
    `
}
