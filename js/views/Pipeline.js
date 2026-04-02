import MainLayout from '../layouts/MainLayout.js?v=24';
import DataTable from '../components/DataTable.js?v=31';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=4';
import { formatRank, formatPercentWithDays, formatNumber } from '../utils/formatters.js';
import { fetchApi } from '../utils/api.js?v=4';

export default {
    name: 'Pipeline',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        FilterDropdown
    },
    data() {
        return {
            loading: false,
            error: null,
            filters: {
                month: new Date().toISOString().slice(0, 7), // YYYY-MM
                leader: 'All',
                vipPlan: ''
            },
            monthPickerConfig: {
                plugins: [
                    typeof monthSelectPlugin !== 'undefined' ? new monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "Y-m",
                        altFormat: "M Y",
                        theme: "light"
                    }) : null
                ].filter(Boolean)
            },
            summary: {
                conversion: {
                    join: { pct: 100 },
                    activate: { pct: 0 },
                    api_bind: { pct: 0 },
                    credit: { pct: 0 },
                    bot_run: { pct: 0 }
                },
                lead_time: {
                    activate: 0,
                    api_bind: 0,
                    credit: 0,
                    bot_run: 0
                }
            },
            searchQuery: '',
            columns: [
                 
                { key: 'leader', label: 'LEADER', sortable: true , thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'total_join', label: 'JOIN', sortable: true, align: 'center' },
                { key: 'activate_pct', label: 'ACTIVATE', sortable: true, align: 'center' },
                { key: 'api_bind_pct', label: 'API BIND', sortable: true, align: 'center' },
                { key: 'credit_pct', label: 'CREDIT', sortable: true, align: 'center' },
                { key: 'bot_run_pct', label: 'BOT RUN', sortable: true, align: 'center' },
                { key: 'avg_lead_time_days', label: 'AVERAGE LEAD TIME', sortable: true, align: 'center' }
            ],
            pipelineData: [],
            selectedLeader: null,
            isFilterOpen: false,
            activeFilters: {},
            // filterSchema moved to computed
            drilldownSearchQuery: '',
            drilldownLoading: false,
            drilldownError: null,
            drilldownMessage: '',
            drilldownColumns: [
                { key: 'username', label: 'USERNAME', sortable: true , thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'PAKET', sortable: true, align: 'center' },
                { key: 'join_date', label: 'TGL JOIN', sortable: true, align: 'center' },
                { key: 'activate', label: 'ACTIVATE', sortable: true, align: 'center' },
                { key: 'api_bind', label: 'API BIND', sortable: true, align: 'center' },
                { key: 'credit', label: 'CREDIT', sortable: true, align: 'center' },
                { key: 'bot_run', label: 'BOT RUN', sortable: true, align: 'center' },
                { key: 'days_from_join', label: 'HARI DARI JOIN', sortable: true, align: 'center' },
                { key: 'upline', label: 'UPLINE RANK 6', sortable: true, align: 'center' },
                { key: 'sponsor', label: 'UPLINE RANK 3', sortable: true, align: 'center' },
                { key: 'msisdn', label: 'NO HP', sortable: true, align: 'center' }
            ],
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
            pagination: {
                page: 1,
                limit: 25,
                totalItems: 0,
                totalPages: 0
            },
            lastUpdated: 'Live Stats'
        }
    },
    computed: {
        filterSchema() {
            if (this.selectedLeader) {
                // Drilldown view filters per Postman
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
                    }
                ];
            } else {
                // Leaders view filters
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
                    }
                ];
            }
        },
        filteredLeaders() {
            let data = this.pipelineData;
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                data = data.filter(item =>
                    (item.leader || '').toLowerCase().includes(query)
                );
            }
            return data;
        },
        filteredDrilldownData() {
            let data = this.drilldownData;
            if (this.drilldownSearchQuery) {
                const query = this.drilldownSearchQuery.toLowerCase();
                data = data.filter(item =>
                    (item.username || '').toLowerCase().includes(query)
                );
            }
            // Basic local filtering (though API handles most)
            if (this.activeFilters && Object.keys(this.activeFilters).length > 0) {
                if (this.activeFilters.paket) {
                    // Mapping paket ID back to label if needed, or just skip if API does the work
                    // For now, let's keep it consistent with the API
                }
            }
            return data;
        }
    },
    watch: {
        filters: {
            handler() {
                this.fetchSummary();
                this.fetchLeaders();
            },
            deep: true
        }
    },
    mounted() {
        this.fetchSummary();
        this.fetchLeaders();
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
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.fetchLeaders();
        },
        handleDrilldownPageChange({ page, rowsPerPage }) {
            this.drilldownPagination.page = page;
            this.drilldownPagination.limit = rowsPerPage;
            this.fetchDrilldown(this.selectedLeader);
        },
        async fetchSummary() {
            try {
                const params = new URLSearchParams();
                
                if (this.filters.month) {
                    params.append('month', this.filters.month);
                }
                
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                let url = '/pipeline/summary';
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await fetchApi(url);
                if (response.success && response.data) {
                    const data = response.data;
                    
                    // Support both new conversion/lead_time structure and potential snapshot fallback
                    if (data.conversion || data.lead_time) {
                        this.summary = {
                            total_join: data.total_join || 0,
                            conversion: data.conversion || {
                                join: { pct: 100 },
                                activate: { pct: 0 },
                                api_bind: { pct: 0 },
                                credit: { pct: 0 },
                                bot_run: { pct: 0 }
                            },
                            lead_time: data.lead_time || {
                                activate: 0,
                                api_bind: 0,
                                credit: 0,
                                bot_run: 0
                            }
                        };
                    } else if (data.snapshot) {
                         const snapshot = data.snapshot;
                         this.summary = {
                            conversion: {
                                join: { pct: 100 },
                                activate: { pct: snapshot.floating_pct || 0 },
                                api_bind: { pct: 0 },
                                credit: { pct: snapshot.credit_nil_pct || 0 },
                                bot_run: { pct: 0 }
                            },
                            lead_time: { activate: 0, api_bind: 0, credit: 0, bot_run: 0 }
                        };
                    }
                    
                    if (data.stat_date) {
                        this.lastUpdated = `Stats for ${this.formatDate(data.stat_date)}`;
                    } else {
                        this.lastUpdated = 'Live Stats';
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pipeline summary:', err);
            }
        },
        async fetchLeaders() {
            this.loading = true;
            this.error = null;
            try {
                const params = new URLSearchParams({
                    page: this.pagination.page,
                    limit: this.pagination.limit
                });
                
                if (this.filters.month) {
                    params.append('month', this.filters.month);
                }
                
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                if (this.searchQuery) params.append('search', this.searchQuery);

                const response = await fetchApi(`/pipeline/leaders?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.pipelineData = (data.leaders || []).map((item, index) => ({
                        id: index + 1,
                        ...item
                    }));

                    if (data.pagination) {
                        this.pagination.totalItems = data.pagination.total || 0;
                        this.pagination.totalPages = data.pagination.total_pages || 0;
                        this.pagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pipeline leaders:', err);
                this.error = 'Failed to load pipeline leaders data.';
            } finally {
                this.loading = false;
            }
        },
        async fetchDrilldown(leaderName) {
            this.drilldownLoading = true;
            this.drilldownError = null;
            try {
                const params = new URLSearchParams({
                    page: this.drilldownPagination.page,
                    limit: this.drilldownPagination.limit
                });

                if (leaderName) {
                    params.append('leader', leaderName);
                }

                if (this.filters.month) {
                    params.append('month', this.filters.month);
                }
                
                if (this.activeFilters.vipPlan) {
                    params.append('plan', this.activeFilters.vipPlan);
                }

                if (this.activeFilters.status) {
                    this.activeFilters.status.forEach(key => {
                        params.append(key, '1');
                    });
                }

                if (this.drilldownSearchQuery) {
                    params.append('search', this.drilldownSearchQuery);
                }

                const url = `/pipeline/drilldown?${params.toString()}`;
                
                const response = await fetchApi(url);
                if (response.success) {
                    const data = response.data;
                    this.drilldownMessage = response.message || '';
                    this.drilldownData = (data.users || []).map((item, index) => ({
                        id: index + 1,
                        ...item
                    }));
                    if (data.summary || response.data.snapshot) {
                         const snap = data.summary || response.data.snapshot;
                         this.drilldownSummary = {
                             total: snap.total || snap.total_eligible_user || 0,
                             activate: snap.activate || 0,
                             api_bind: snap.api_bind || 0,
                             credit: snap.credit || 0,
                             bot_run: snap.bot_run || 0
                         };
                    } else {
                        this.drilldownSummary = { total: 0, activate: 0, api_bind: 0, credit: 0, bot_run: 0 };
                    }
                    if (data.pagination) {
                        this.drilldownPagination.totalItems = data.pagination.total || 0;
                        this.drilldownPagination.totalPages = data.pagination.total_pages || 0;
                        this.drilldownPagination.page = data.pagination.current_page || 1;
                    } else {
                        this.drilldownPagination.totalItems = 0;
                        this.drilldownPagination.totalPages = 0;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pipeline drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
            } finally {
                this.drilldownLoading = false;
            }
        },
        selectLeader(leaderName) {
            this.selectedLeader = leaderName;
            this.searchQuery = leaderName;
            this.drilldownSearchQuery = '';
            this.activeFilters = {};
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(leaderName);
        },
        clearSelection() {
            this.selectedLeader = null;
            this.searchQuery = '';
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        applyFilters() {
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(this.selectedLeader);
            this.isFilterOpen = false;
        },
        resetFilters() {
            this.activeFilters = {};
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(this.selectedLeader);
            this.isFilterOpen = false;
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
        getHealthIndexClass(value) {
            const val = parseFloat(value);
            if (val > 0.8) return 'bg-[#39DEBB] text-white'; // Green
            if (val >= 0.6) return 'bg-[#F9B33F] text-white'; // Orange
            return 'bg-[#F24E6C] text-white'; // Red
        },
        getHealthIndexTextClass(value) {
            const val = parseFloat(value);
            if (val > 0.8) return 'text-[#39DEBB]'; // Green
            if (val >= 0.6) return 'text-[#F9B33F]'; // Orange
            return 'text-[#F24E6C]'; // Red
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Pipeline</h1>
            </div>

            <div v-if="!selectedLeader">
                <!-- Filters -->
                <div class="flex flex-wrap items-center gap-4 mb-8">
                    <!-- Month Filter -->
                    <div class="relative">
                        <DatePicker v-model="filters.month" :config="monthPickerConfig">
                            <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                                <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">Month:</span>
                                <span class="py-2 pl-2 pr-10 text-sm font-medium min-w-[120px]">{{ filters.month || 'Select Month' }}</span>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </DatePicker>
                    </div>

                    <!-- Leader Filter -->
                    <div class="relative">
                        <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                            <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">Leader :</span>
                            <select v-model="filters.leader" class="appearance-none bg-transparent py-2 pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                                <option value="All">All</option>
                                <option value="6 ⭐">6 ⭐</option>
                                <option value="Main Leader">Main Leader</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <!-- VIP Plan Filter -->
                    <div class="relative">
                        <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                            <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">VIP Plan :</span>
                            <select v-model="filters.vipPlan" class="appearance-none bg-transparent py-2 pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                                <option value="All">All</option>
                                <option value="1">B+</option>
                                <option value="2">A+</option>
                                <option value="3">P+</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Search -->
                    <div class="relative bg-white border border-gray-100 rounded-full shadow-sm flex items-center px-4 py-2 w-64 ml-4">
                        <input type="text" v-model="searchQuery" placeholder="Search" class="appearance-none bg-transparent focus:outline-none w-full text-gray-700 text-sm" />
                        <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <!-- Average Conversion section -->
                <div class="mb-8">
                    <div class="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Average Conversion <span class="text-gray-400 font-normal normal-case">(by VIP plan)</span></div>
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap py-2 overflow-x-auto custom-scrollbar">
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Join</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.join.pct }}%</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Activate</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.activate.pct }}%</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">API Bind</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.api_bind.pct }}%</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Credit</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.credit.pct }}%</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Bot Run</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.bot_run.pct }}%</div>
                        </div>
                    </div>
                </div>

                <!-- Average Lead Time section -->
                <div class="mb-8">
                    <div class="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Average Lead Time <span class="text-gray-400 font-normal normal-case">(by VIP plan)</span></div>
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap py-2 overflow-x-auto custom-scrollbar">
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Activate</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.activate }} days</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">API Bind</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.api_bind }} days</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Credit</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.credit }} days</div>
                        </div>
                        <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-6  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                            <div class="text-[10px] text-gray-500 mb-3 font-medium uppercase tracking-wide whitespace-nowrap">Bot Run</div>
                            <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.bot_run }} days</div>
                        </div>
                    </div>
                </div>

                <!-- Table Section -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <!-- Data Table Toolbar (Search Only) -->
                    <div class="flex flex-wrap md:flex-nowrap justify-start items-center mb-6">
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search" class="h-full border-gray-200" />
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF] mb-4"></div>
                        <p class="text-gray-500 text-sm">Loading pipeline data...</p>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <span>{{ error }}</span>
                        <button @click="fetchLeaders" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                    </div>

                    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <DataTable 
                            key="leaders-table"
                            :columns="columns" 
                            :data="filteredLeaders"
                            server-side
                            :total-items="pagination.totalItems"
                            :total-pages="pagination.totalPages"
                            :current-page="pagination.page"
                            :default-rows-per-page="pagination.limit"
                            @page-change="handlePageChange"
                        >
                            <!-- Hide ACTION column -->
                            <template #action-header><th></th></template>

                            <!-- Custom Leader Cell -->
                            <template #cell-leader="{ value }">
                                <span @click="selectLeader(value)" class="text-[#00A3FF] underline cursor-pointer hover:text-blue-600">
                                    {{ value }}
                                </span>
                            </template>

                            <!-- Custom Join Cell -->
                            <template #cell-total_join="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? formatNumber(value) : '-' }}</span>
                                </div>
                            </template>
\t\t\t\t\t\t\t
                            <!-- Custom Activate Cell -->
                            <template #cell-activate_pct="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                                </div>
                            </template>

                            <!-- Custom API Bind Cell -->
                            <template #cell-api_bind_pct="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                                </div>
                            </template>

                            <!-- Custom Credit Cell -->
                            <template #cell-credit_pct="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                                </div>
                            </template>

                            <!-- Custom Bot Run Cell -->
                            <template #cell-bot_run_pct="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                                </div>
                            </template>

                            <!-- Custom Average Lead Time Cell -->
                            <template #cell-avg_lead_time_days="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value + ' days' : '-' }}</span>
                                </div>
                            </template>

                            <!-- Empty row-actions to hide action cells -->
                            <template #row-actions></template>

                            <template #cell-id="{ value }">
                                <span class="text-gray-500 font-medium whitespace-nowrap px-2">{{ value }}</span>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
            
            <div v-else>
                <!-- Drilldown Section -->
                <div class="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-400">
                    <!-- Drilldown Header -->
                    <div class="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4">
                        <button @click="clearSelection" class="p-1 hover:bg-gray-100 rounded text-[#00A3FF]">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 class="text-lg font-bold text-gray-800">
                            Drilldown Summary ({{ filters.month }}) - {{ selectedLeader }}
                        </h2>
                    </div>

                    <!-- Toolbar -->
                    <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                        <div class="flex flex-wrap items-center gap-2 w-full md:w-auto relative">
                            <!-- Filter Button with Dropdown -->
                            <div class="relative">
                                <button 
                                    @click="toggleFilter"
                                    class="filter-trigger h-10 w-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none relative z-20"
                                >
                                   <img src="./assets/images/icons/filter.svg" alt="Filter" class="h-4 w-4">
                                </button>
                                
                                <filter-dropdown
                                    :is-open="isFilterOpen"
                                    :schema="filterSchema"
                                    v-model="activeFilters"
                                    @close="isFilterOpen = false"
                                    @apply="applyFilters"
                                ></filter-dropdown>
                            </div>
                            
                            <!-- Search -->
                            <div class="w-full md:w-64 h-10">
                                <SearchInput v-model="drilldownSearchQuery" placeholder="Search" class="h-full border-gray-200 text-sm" />
                            </div>
                        </div>
                         <!-- Download Button -->
                         <button class="text-gray-400 hover:text-gray-600">
                            <img src="./assets/images/icons/download.svg" alt="Download" class="h-5 w-5">
                        </button>
                    </div>

                    <!-- Loading State -->
                    <div v-if="drilldownLoading" class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF] mb-4"></div>
                        <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="drilldownError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <span>{{ drilldownError }}</span>
                        <button @click="fetchDrilldown(selectedLeader)" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                    </div>


                    <!-- Summary Row header in Table -->
                    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <DataTable 
                            key="drilldown-table"
                            :columns="drilldownColumns" 
                            :data="filteredDrilldownData"
                            server-side
                            :total-items="drilldownPagination.totalItems"
                            :total-pages="drilldownPagination.totalPages"
                            :current-page="drilldownPagination.page"
                            :default-rows-per-page="drilldownPagination.limit"
                            @page-change="handleDrilldownPageChange"
                        >
                            <!-- Hide ACTION column -->
                            <template #action-header><th></th></template>
                            <template #row-actions></template>
                            
                            <template #table-prepend>
                                <tr class="bg-white border-b border-gray-200">
                                    <td colspan="5" class="py-3 px-4 text-center font-bold text-gray-800 border-r border-dotted border-gray-300">
                                        <div class="flex justify-start px-8">
                                            <span>{{ drilldownSummary.total }}/{{ drilldownSummary.total }}</span>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-gray-800">
                                        {{ drilldownSummary.activate }}/{{ drilldownSummary.total }}
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-gray-800">
                                        {{ drilldownSummary.api_bind }}/{{ drilldownSummary.total }}
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-gray-800">
                                        {{ drilldownSummary.credit }}/{{ drilldownSummary.total }}
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-gray-800">
                                        {{ drilldownSummary.bot_run }}/{{ drilldownSummary.total }}
                                    </td>
                                </tr>
                            </template>

                            <template #cell-id="{ value }">
                                <span class="text-gray-500 font-medium whitespace-nowrap px-2">{{ value }}</span>
                            </template>

                             <template #cell-username="{ value }">
                                <span class="font-medium text-gray-900">{{ value || '-' }}</span>
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

                            <!-- Checkmark/Cross Cells -->
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

                            <template #cell-upline="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value : '-' }}</span>
                                </div>
                            </template>

                            <template #cell-sponsor="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value : '-' }}</span>
                                </div>
                            </template>

                            <template #cell-msisdn="{ value }">
                                <div class="flex justify-center">
                                    <span class="text-gray-700">{{ value !== null && value !== undefined ? value : '-' }}</span>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </MainLayout>
    `
}
