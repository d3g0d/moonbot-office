import MainLayout from '../layouts/MainLayout.js?v=24';
import SearchInput from '../components/SearchInput.js';
import DataTable from '../components/DataTable.js?v=24';
import FilterDropdown from '../components/FilterDropdown.js?v=4';
import DatePicker from '../components/DatePicker.js?v=2';
import { formatNumber } from '../utils/formatters.js'; 
import { fetchApi } from '../utils/api.js?v=4';
export default {
    name: 'BotHealth',
    components: {
        MainLayout,
        SearchInput,
        DataTable,
        FilterDropdown,
        DatePicker
    },
    data() {
        return {
            searchQuery: '',
            filters: {
                date: '', // Stores YYYY-MM-DD
                vipPlan: 'All'
            },
            loading: false,
            error: null,
            selectedLeader: null,
            isFilterOpen: false,
            activeFilters: {},
            lastUpdated: 'Calculating...',
            datePickerConfig: {
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'M j, Y'
            },
            // filterSchema moved to computed
            columns: [
                { key: 'leader', label: 'LEADER', sortable: true, thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'insufficient_funds', label: 'INSUFFICIENT FUNDS', sortable: true, align: 'center' },
                { key: 'avg_days_off_floating', label: 'AVG DAYS OFF (FLOATING)', sortable: true, align: 'center' },
                { key: 'credit_nil', label: 'CREDIT NIL', sortable: true, align: 'center' },
                { key: 'avg_days_off_credit', label: 'AVG DAYS OFF (CREDIT)', sortable: true, align: 'center' },
                { key: 'total_users', label: 'TOTAL ELIGIBLE USER', sortable: true, align: 'center' },
                { key: 'health_index', label: 'HEALTH INDEX', sortable: true, align: 'center' }
            ],
            // Leader Detail Table Columns
            detailColumns: [
                { key: 'username', label: 'USERNAME', sortable: true, thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'PAKET', sortable: true, align: 'center' },
                { key: 'floating', label: 'INSUFFICIENT FUNDS', sortable: true, align: 'center' },
                { key: 'days_floating_streak', label: 'AVG DAYS OFF (FLOATING)', sortable: true, align: 'center' },
                { key: 'insufficient_credit', label: 'CREDIT', sortable: true, align: 'center' },
                { key: 'days_credit_streak', label: 'AVG DAYS OFF (CREDIT)', sortable: true, align: 'center' },
                { key: 'upline', label: 'UPLINE', sortable: true, align: 'center' },
                { key: 'sponsor', label: 'SPONSOR', sortable: true, align: 'center' },
                { key: 'step_count', label: 'MM', sortable: true, align: 'center' },
                { key: 'max_coin', label: 'MAX COIN', sortable: true, align: 'center' },
                { key: 'avg_buy_amount', label: 'AVG BUY AMOUNT', sortable: true, align: 'center' },
                { key: 'msisdn', label: 'NO HP', sortable: true, align: 'center' }
            ],
            botHealthData: [],
            leaderUsers: [],
            drilldownLoading: false,
            drilldownError: null,
            summary: {
                total_eligible_user: 0,
                insufficient_funds: 0,
                avg_days_off_floating: 0,
                credit_nil: 0,
                avg_days_off_credit: 0,
                health_index: 0
            },
            pagination: {
                page: 1,
                limit: 25,
                totalItems: 0,
                totalPages: 0
            },
            drilldownPagination: {
                page: 1,
                limit: 50,
                totalItems: 0,
                totalPages: 0
            }
        }
    },
    computed: {
        filterSchema() {
            if (this.selectedLeader) {
                // Drilldown view filters
                return [
                    {
                        type: 'checkbox-group',
                        label: 'Funds',
                        key: 'funds',
                        options: [
                            { label: 'Sufficient', value: 'Sufficient' },
                            { label: 'Insufficient', value: 'Insufficient' }
                        ]
                    },
                    {
                        type: 'checkbox-group',
                        label: 'Credit',
                        key: 'creditStatus',
                        options: [
                            { label: 'Credit Available', value: 'Credit Available' },
                            { label: 'No Credit Available', value: 'No Credit Available' }
                        ]
                    },
                    {
                        type: 'text',
                        label: 'Upline rank 6',
                        key: 'uplineRank6',
                        placeholder: 'Username'
                    },
                    {
                        type: 'text',
                        label: 'Upline rank 3',
                        key: 'uplineRank3',
                        placeholder: 'Username'
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
                    },
                    {
                        type: 'date',
                        label: 'Start Date',
                        key: 'startDate'
                    },
                    {
                        type: 'date',
                        label: 'End Date',
                        key: 'endDate'
                    }
                ];
            }
        },
        filteredData() {
            return this.selectedLeader ? this.leaderUsers : this.botHealthData;
        },
        currentColumns() {
            return this.selectedLeader ? this.detailColumns : this.columns;
        },
        summaryStats() {
            return [
                { label: 'Floating', value: formatNumber(this.summary.insufficient_funds), suffix: ` (${this.summary.floating_pct}%)` },
                { label: 'Avg days OFF (floating)', value: formatNumber(this.summary.avg_days_off_floating) },
                { label: 'Credit NIL', value: formatNumber(this.summary.credit_nil), suffix: ` (${this.summary.credit_nil_pct}%)` },
                { label: 'Avg days OFF (credit)', value: formatNumber(this.summary.avg_days_off_credit) },
                { label: 'Total Eligible User', value: formatNumber(this.summary.total_eligible_user) },
                { label: 'Health Index', value: this.summary.health_index }
            ];
        }
    },
    mounted() {
        this.fetchSummary();
        this.fetchBotHealth();
    },
    methods: {
        formatNumber,
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.fetchBotHealth();
        },
        handleDrilldownPageChange({ page, rowsPerPage }) {
            this.drilldownPagination.page = page;
            this.drilldownPagination.limit = rowsPerPage;
            this.fetchDrilldown(this.selectedLeader);
        },
        async fetchSummary() {
            try {
                let url = '/bot-health/summary';
                const params = new URLSearchParams();
                
                // Add Date
                if (this.filters.date) {
                    params.append('date', this.filters.date);
                }

                // Add VIP Plan
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }
                
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await fetchApi(url);
                if (response.success && response.data && response.data.snapshot) {
                    const data = response.data;
                    const snapshot = data.snapshot;
                    
                    // Map API fields to UI summary fields
                    this.summary = {
                        total_eligible_user: snapshot.total_eligible_user || 0,
                        insufficient_funds: snapshot.floating_count || 0,
                        avg_days_off_floating: snapshot.avg_days_off_floating || 0,
                        credit_nil: snapshot.credit_nil_count || 0,
                        avg_days_off_credit: snapshot.avg_days_off_credit || 0,
                        health_index: snapshot.health_index || 0,
                        floating_pct: snapshot.floating_pct || 0,
                        credit_nil_pct: snapshot.credit_nil_pct || 0
                    };
                    
                    if (data.stat_date) {
                        const dateText = this.formatDate(data.stat_date);
                        this.lastUpdated = `Stats for ${dateText}`;
                    } else {
                        this.lastUpdated = 'Live Stats';
                    }
                }
            } catch (err) {
                console.error('Failed to fetch bot health summary:', err);
            }
        },
        async fetchBotHealth() {
            this.loading = true;
            this.error = null;
            try {
                const params = new URLSearchParams({
                    page: this.pagination.page,
                    limit: this.pagination.limit
                });
                
                if (this.searchQuery) params.append('search', this.searchQuery);
                
                // Add Toolbar Filters for Leaders
                if (this.activeFilters.startDate) params.append('start_date', this.activeFilters.startDate);
                if (this.activeFilters.endDate) params.append('end_date', this.activeFilters.endDate);
                if (this.activeFilters.vipPlan && this.activeFilters.vipPlan !== '') {
                    params.append('plan', this.activeFilters.vipPlan);
                }

                const response = await fetchApi(`/bot-health/leaders?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.botHealthData = data.summaries || [];

                    if (data.pagination) {
                        this.pagination.totalItems = data.pagination.total || 0;
                        this.pagination.totalPages = data.pagination.total_pages || 0;
                        this.pagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch bot health leaders:', err);
                this.error = 'Failed to load bot health analysis.';
            } finally {
                this.loading = false;
            }
        },
        formatDate(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        },
        selectLeader(leader) {
            this.selectedLeader = leader;
            this.searchQuery = '';
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(leader);
        },
        async fetchDrilldown(leader) {
            this.drilldownLoading = true;
            this.drilldownError = null;
            try {
                const params = new URLSearchParams({
                    leader: leader.leader,
                    page: this.drilldownPagination.page,
                    limit: this.drilldownPagination.limit
                });

                if (this.searchQuery) params.append('search', this.searchQuery);

                // Add Date for Drilldown
                if (this.filters.date) {
                    params.append('date', this.filters.date);
                }

                // Add Toolbar Filters for Drilldown
                if (this.activeFilters.funds && this.activeFilters.funds.includes('Insufficient')) {
                    params.append('floating', '1');
                }
                if (this.activeFilters.creditStatus && this.activeFilters.creditStatus.includes('No Credit Available')) {
                    params.append('credit', '1');
                }

                let url = `/bot-health/drilldown?${params.toString()}`;
                const response = await fetchApi(url);
                if (response.success) {
                    const data = response.data;
                    this.leaderUsers = (data.users || []).map((item, index) => ({
                        id: index + 1,
                        ...item
                    }));
                    if (data.pagination) {
                        this.drilldownPagination.totalItems = data.pagination.total || 0;
                        this.drilldownPagination.totalPages = data.pagination.total_pages || 0;
                        this.drilldownPagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch bot health drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
            } finally {
                this.drilldownLoading = false;
            }
        },
        clearSelection() {
            this.selectedLeader = null;
            this.searchQuery = ''; // Reset search on transition
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
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        applyFilters() {
            this.isFilterOpen = false;
            if (this.selectedLeader) {
                this.drilldownPagination.page = 1;
                this.fetchDrilldown(this.selectedLeader);
            } else {
                this.pagination.page = 1;
                this.fetchBotHealth();
            }
        }
    },
    watch: {
        searchQuery(newVal) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (this.selectedLeader) {
                    this.drilldownPagination.page = 1;
                    this.fetchDrilldown(this.selectedLeader);
                } else {
                    this.pagination.page = 1;
                    this.fetchBotHealth();
                }
            }, 500);
        },
        filters: {
            deep: true,
            handler() {
                if (this.selectedLeader) {
                    this.drilldownPagination.page = 1;
                    this.fetchDrilldown(this.selectedLeader);
                } else {
                    this.pagination.page = 1;
                    this.fetchSummary();
                    this.fetchBotHealth();
                }
            }
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Bot Health</h1>
                <div class="text-xs text-gray-500 italic">
                    {{ lastUpdated }}
                </div>
            </div>

            <!-- Global Timeframe Filter -->
            <div class="flex flex-wrap gap-4 mb-8">
                <!-- Date Filter -->
                <div class="relative">
                    <DatePicker v-model="filters.date" :config="datePickerConfig">
                        <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                            <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">Timeframe:</span>
                            <span class="py-2 pl-2 pr-10 text-sm font-medium min-w-[120px]">{{ filters.date ? formatDate(filters.date) : 'Today' }}</span>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </DatePicker>
                </div>
            </div>

            <!-- View Content -->
            <div v-if="!selectedLeader" class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap mb-8 py-2 overflow-x-auto custom-scrollbar">
                <!-- Stats/Metrics Cards -->
                <div v-for="(stat, index) in summaryStats" :key="index" 
                    class="flex-1 min-w-[150px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                    <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">{{ stat.label }}</div>
                    <div :class="['text-base lg:text-lg font-bold whitespace-nowrap', stat.label === 'Health Index' ? getHealthIndexTextClass(stat.value) : 'text-gray-900']">
                        {{ stat.value }}{{ stat.suffix || '' }}
                    </div>
                </div>
            </div>

            <!-- Analysis Section -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                 <div class="mb-6 flex items-center gap-2">
                    <!-- Back Button for Detail View -->
                    <button 
                        v-if="selectedLeader" 
                        @click="clearSelection"
                        class="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 class="text-lg font-bold text-gray-900">
                        {{ selectedLeader ? 'Leader - ' + selectedLeader.leader : 'Bot Health Analysis by Leader' }}
                    </h2>
                </div>

                <!-- Toolbar -->
                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                    <div class="flex flex-wrap items-center gap-4 w-full md:w-auto"> 
                        <!-- Filter Button & Dropdown -->
                        <div class="relative">
                            <button 
                                @click="toggleFilter"
                                class="filter-trigger h-11 w-11 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none relative z-20"
                            >
                                <img src="./assets/images/icons/filter.svg" alt="Filter">
                            </button>
                            
                            <filter-dropdown
                                :is-open="isFilterOpen"
                                :schema="filterSchema"
                                v-model="activeFilters"
                                @close="isFilterOpen = false"
                                @apply="applyFilters"
                            ></filter-dropdown>
                        </div>

                        <!-- Search Input -->
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search" class="h-full border-gray-200" />
                        </div>
                    </div>

                    <!-- Download Button -->
                    <button class="text-gray-400 hover:text-gray-600">
                        <img src="./assets/images/icons/download.svg" alt="Download" class="h-6 w-6">
                    </button>
                </div>

                <!-- Loading State (Main) -->
                <div v-if="loading && !selectedLeader" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading bot health data...</p>
                </div>

                <!-- Error State (Main) -->
                <div v-else-if="error && !selectedLeader" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ error }}</span>
                    <button @click="fetchBotHealth" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <!-- Drilldown Loading -->
                <div v-else-if="drilldownLoading && selectedLeader" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                </div>

                <!-- Drilldown Error -->
                <div v-else-if="drilldownError && selectedLeader" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ drilldownError }}</span>
                    <button @click="fetchDrilldown(selectedLeader)" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <!-- Main Data Table -->
                <DataTable 
                    v-if="!selectedLeader && !loading"
                    key="main-table"
                    :columns="currentColumns" 
                    :data="filteredData"
                    server-side
                    :total-items="pagination.totalItems"
                    :total-pages="pagination.totalPages"
                    :current-page="pagination.page"
                    :default-rows-per-page="pagination.limit"
                    @page-change="handlePageChange"
                >
                    <!-- Custom leader cell (LEADER) -->
                    <template #cell-leader="{ value, row }">
                         <span 
                            @click="selectLeader(row)"
                            class="text-[#00A3FF] underline cursor-pointer hover:text-blue-600"
                        >
                            {{ value || '-' }}
                        </span>
                    </template>

                    <!-- Custom insufficient_funds cell -->
                    <template #cell-insufficient_funds="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-500">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <!-- Custom credit_nil cell -->
                     <template #cell-credit_nil="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-500">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-avg_days_off_floating="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-500">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-avg_days_off_credit="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-500">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-total_users="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-500">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-health_index="{ value }">
                        <div v-if="value !== null && value !== undefined" class="flex justify-center">
                             <span :class="['text-xs font-medium px-2 py-1 rounded', getHealthIndexClass(value)]">
                                 {{ value }}
                            </span>
                        </div>
                        <div v-else class="flex justify-center">
                            <span class="text-gray-400">-</span>
                        </div>
                    </template>
                </DataTable>

                <!-- Drilldown Data Table -->
                <DataTable 
                    v-if="selectedLeader && !drilldownLoading"
                    key="drilldown-table"
                    :columns="detailColumns" 
                    :data="leaderUsers"
                    server-side
                    :total-items="drilldownPagination.totalItems"
                    :total-pages="drilldownPagination.totalPages"
                    :current-page="drilldownPagination.page"
                    :default-rows-per-page="drilldownPagination.limit"
                    @page-change="handleDrilldownPageChange"
                >
                    <!-- Custom leader cell (USERNAME) -->
                    <template #cell-username="{ value }">
                        <span class="text-gray-900 font-medium">
                            {{ value || '-' }}
                        </span>
                    </template>

                    <!-- Detail View Cells -->
                    <template #cell-vip_level="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">
                                {{ value === 0 || value === 1 ? 'B+' : (value === 2 ? 'A+' : 'P+') }}
                            </span>
                        </div>
                    </template>

                    <template #cell-max_coin="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-floating="{ value }">
                        <div class="flex justify-center">
                            <span v-if="value && value != '0' && value != 0" class="text-red-500 font-bold text-lg">❌</span>
                            <span v-else class="text-green-500 font-bold text-lg">✅</span>
                        </div>
                    </template>

                    <template #cell-days_floating_streak="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-insufficient_credit="{ value }">
                        <div class="flex justify-center">
                            <span v-if="value && value != '0' && value != 0" class="text-red-500 font-bold text-lg">❌</span>
                            <span v-else class="text-green-500 font-bold text-lg">✅</span>
                        </div>
                    </template>

                    <template #cell-days_credit_streak="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-step_count="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-avg_buy_amount="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>

                    <template #cell-upline="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ value || '-' }}</span>
                        </div>
                    </template>

                    <template #cell-sponsor="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ value || '-' }}</span>
                        </div>
                    </template>

                    <template #cell-msisdn="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700 text-xs break-all max-w-[150px]">{{ value || '-' }}</span>
                        </div>
                    </template>
                </DataTable>

                <!-- Legend (Main View Only) -->
                 <div v-if="!selectedLeader" class="mt-6 flex flex-wrap justify-end gap-6 text-xs text-gray-600">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-[#39DEBB]"></span>
                        <span>> 0.8 = Strong Performance</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-[#F9B33F]"></span>
                        <span>0.6 – 0.8 = Requires Attention</span>
                    </div>
                     <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-[#F24E6C]"></span>
                        <span>< 0.6 = Critical Weakness</span>
                    </div>
                </div>

            </div>
        </MainLayout>
    `
}
