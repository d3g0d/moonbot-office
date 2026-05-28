import MainLayout from '../layouts/MainLayout.js?v=27';
import DataTable from '../components/DataTable.js?v=36';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=5';
import DatePicker from '../components/DatePicker.js?v=4';
import { formatNumber, formatRank, JsonToCSV, JsonToPDF, getDefaultDateRange } from '../utils/formatters.js?v=5';
import { fetchApi, BASE_URL } from '../utils/api.js?v=6';
import { decryptQuery, encryptQuery } from '../utils/crypto.js?v=3';


export default {
    name: 'TradingActivityDrilldown',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        FilterDropdown,
        DatePicker
    },
    data() {
        const query = decryptQuery(this.$route.query);
        return {
            selectedLeader: query.leader || '',
            filters: {
                dateRange: query.dateRange || getDefaultDateRange(),
                potentialTopUp: query.potentialTopUp !== undefined ? (query.potentialTopUp === true || query.potentialTopUp === 'true') : true
            },
            rangePickerConfig: {
                mode: 'range',
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'M j, Y',
                onValueUpdate: (selectedDates, dateStr, instance) => {
                    if (selectedDates.length === 2) {
                        const start = selectedDates[0];
                        const end = selectedDates[1];
                        const diffInDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                        if (diffInDays > 90) {
                            alert('Maximum date range is 90 days');
                            instance.clear();
                        }
                    }
                },
                onReady: (selectedDates, dateStr, instance) => {
                    const container = instance.calendarContainer;
                    if (!container) return;
                    
                    if (container.querySelector('.flatpickr-actions-custom')) return;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'flatpickr-actions-custom flex border-t border-gray-100 mt-1 p-1';
                    
                    const btn = document.createElement('button');
                    btn.innerHTML = 'All Time';
                    btn.className = 'w-full py-2 text-sm font-bold text-[#39DEBB] hover:bg-gray-50 rounded-lg transition-colors';
                    btn.type = 'button';
                    
                    btn.addEventListener('click', () => {
                        instance.clear();
                        instance.close();
                    });
                    
                    actionsDiv.appendChild(btn);
                    container.appendChild(actionsDiv);
                }
            },
            searchQuery: '',
            drilldownLoading: false,
            drilldownError: null,
            drilldownPagination: {
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 50,
                totalItems: 0,
                totalPages: 0
            },
            drilldownSort: {
                sortBy: query.sort_by || 'total_profit',
                sortDir: query.sort_dir || 'desc'
            },
            drilldownColumns: [
                { key: 'username', label: 'Username', sortable: true , thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'Paket', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'is_active_30d', label: 'Active 30D', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'total_profit', label: 'Profit', sortable: true, colWidth: '150px' },
                { key: 'wallet_usdt', label: 'credit (USDT)', sortable: true, colWidth: '150px' },
                { key: 'stableCapital', label: 'stable capital', sortable: true, colWidth: '150px' },
                { key: 'msisdn', label: 'NO HP', sortable: true, class: 'whitespace-nowrap', colWidth: '150px' },
                { key: 'coinGroup', label: 'coin group', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'mm', label: 'MM', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'maxCoin', label: 'Max coin', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'upper_upline', label: 'DOUBLE EXECUTIVE', sortable: true, align: 'center', colWidth: '150px' },
                { key: 'upline', label: 'GOLD', sortable: true, align: 'center', colWidth: '150px' }
            ],
            drilldownData: [],
            activeFilters: {},
            isFilterOpen: false,
            filterSchema: [
                {
                    type: 'checkbox-group',
                    label: 'VIP Plan',
                    key: 'vipPlan',
                    options: [
                        { label: 'Basic', value: 'Basic' },
                        { label: 'Advance', value: 'Advance' },
                        { label: 'Pro+', value: 'Pro+' }
                    ]
                },
                {
                    type: 'input-range',
                    label: 'Profit (All Time)',
                    key: 'profit_min',
                    prefix: '$',
                    placeholder: '00.00'
                },
                {
                    type: 'radio-group',
                    label: 'Credit (USDT)',
                    key: 'credit',
                    options: [
                        { label: 'All', value: '' },
                        { label: '>3$', value: '1' },
                        { label: '≤3$', value: '0' }
                    ]
                },
                {
                    type: 'days-input',
                    label: 'Stable Capital',
                    key: 'stable_capital',
                    placeholder: '00'
                },
                {
                    type: 'text',
                    label: 'GOLD',
                    key: 'upline',
                    placeholder: 'Username'
                },
                {
                    type: 'text',
                    label: 'Double Executive',
                    key: 'upper_upline',
                    placeholder: 'Username'
                }
            ],
            lastUpdated: 'Live Stats'
        }
    },
    mounted() {
        if (!this.selectedLeader) {
            this.$router.push('/trading-activity');
            return;
        }
        this.fetchDrilldown();
    },
    methods: {
        formatNumber,
        formatRank,
        formatDate(dateStr) {
            if (!dateStr) return '-';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr;
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const y = String(date.getFullYear()).slice(-2);
                return `${d}/${m}/${y}`;
            } catch (e) {
                return dateStr || '-';
            }
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

                if (this.searchQuery) params.append('search', this.searchQuery);
                params.append('potential_topup', this.filters.potentialTopUp ? '1' : '0');

                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    } else if (dates.length === 1) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[0]);
                    }
                }

                if (this.activeFilters.vipPlan && Array.isArray(this.activeFilters.vipPlan)) {
                    this.activeFilters.vipPlan.forEach(plan => {
                        let planVal = plan;
                        if (plan === 'Basic') planVal = '1';
                        else if (plan === 'Advance') planVal = '2';
                        else if (plan === 'Pro+') planVal = '3';
                        params.append('plan', planVal);
                    });
                }
                
                if (this.activeFilters.stable_capital) params.append('stable_capital', this.activeFilters.stable_capital);
                if (this.activeFilters.profit_min) params.append('profit_min', this.activeFilters.profit_min);
                if (this.activeFilters.credit) {
                    if (Array.isArray(this.activeFilters.credit)) {
                         this.activeFilters.credit.forEach(c => params.append('credit', c));
                    } else {
                         params.append('credit', this.activeFilters.credit);
                    }
                }
                if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
                if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

                if (this.drilldownSort.sortBy) {
                    params.append('sort_by', this.drilldownSort.sortBy);
                    params.append('sort_dir', this.drilldownSort.sortDir || 'desc');
                }

                const response = await fetchApi(`/trading-activity/drilldown?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.drilldownData = (data.users || []).map(item => ({
                        ...item,
                        vip_level: item.vip_level === 1 ? 'B+' : (item.vip_level === 2 ? 'A+' : (item.vip_level === 3 ? 'P+' : '-')),
                        is_active_30d: item.is_active_30d, 
                        total_profit: formatNumber(item.total_profit || 0, { prefix: '$ ' }),
                        wallet_usdt: formatNumber(item.wallet_usdt || 0),
                        stableCapital: this.formatDate(item.stable_capital_date),
                        msisdn: item.msisdn || '-',
                        coinGroup: (item.coin_group || '-').replace(/_/g, ' '),
                        mm: item.step_count ,
                        maxCoin: item.max_coin || '-',
                        upper_upline: item.upper_upline || '-',
                        upline: item.upline || '-'
                    }));
                    if (data.pagination) {
                        this.drilldownPagination.totalItems = data.pagination.total || 0;
                        this.drilldownPagination.totalPages = data.pagination.total_pages || 0;
                        this.drilldownPagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch trading activity drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
                if (window.Sentry) Sentry.captureException(err, { category: 'drilldown_fetch' });
            } finally {
                this.drilldownLoading = false;
            }
        },
        syncQueryParams() {
            const query = { ...decryptQuery(this.$route.query) };
            if (this.searchQuery) query.search = this.searchQuery;
            if (this.filters.dateRange) query.dateRange = this.filters.dateRange;
            if (this.filters.potentialTopUp !== true) query.potentialTopUp = this.filters.potentialTopUp;
            if (this.drilldownSort.sortBy) query.sort_by = this.drilldownSort.sortBy;
            if (this.drilldownSort.sortDir) query.sort_dir = this.drilldownSort.sortDir;
            if (this.drilldownPagination.page > 1) query.page = this.drilldownPagination.page;
            if (this.drilldownPagination.limit !== 50) query.limit = this.drilldownPagination.limit;
            
            // Sync active filters from dropdown
            if (this.activeFilters.funds) query.funds = this.activeFilters.funds;
            if (this.activeFilters.creditStatus) query.creditStatus = this.activeFilters.creditStatus;
            if (this.activeFilters.upline) query.upline = this.activeFilters.upline;
            if (this.activeFilters.upper_upline) query.upper_upline = this.activeFilters.upper_upline;

            this.$router.replace({ query: encryptQuery(query) }).catch(() => {});
        },
        goBack() {
            const query = decryptQuery(this.$route.query);
            const parentQuery = {};
            if (query._p_leader && query._p_leader !== 'All') parentQuery.leader = query._p_leader;
            if (query._p_vipPlan && query._p_vipPlan !== 'All') parentQuery.vipPlan = query._p_vipPlan;
            if (query.dateRange) parentQuery.dateRange = query.dateRange;
            if (query._p_sort_by) parentQuery.sort_by = query._p_sort_by;
            if (query._p_sort_dir) parentQuery.sort_dir = query._p_sort_dir;
            if (query._p_page && query._p_page !== '1') parentQuery.page = query._p_page;
            if (query._p_limit && query._p_limit !== '50') parentQuery.limit = query._p_limit;
            if (query._p_search) parentQuery.search = query._p_search;

            this.$router.push({ name: 'TradingActivity', query: encryptQuery(parentQuery) });
        },
        applyFilters() {
            this.isFilterOpen = false;
            this.drilldownPagination.page = 1;
            this.fetchDrilldown();
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        async exportDrilldown() {
            const params = new URLSearchParams({
                leader: this.selectedLeader,
                search: this.searchQuery || ''
            });

            params.append('potential_topup', this.filters.potentialTopUp ? '1' : '0');

            if (this.filters.dateRange) {
                const dates = this.filters.dateRange.split(' to ');
                if (dates.length === 2) {
                    params.append('start_date', dates[0]);
                    params.append('end_date', dates[1]);
                } else if (dates.length === 1) {
                    params.append('start_date', dates[0]);
                    params.append('end_date', dates[0]);
                }
            }

            if (this.activeFilters.vipPlan && Array.isArray(this.activeFilters.vipPlan)) {
                this.activeFilters.vipPlan.forEach(plan => {
                    let planVal = plan;
                    if (plan === 'Basic') planVal = '1';
                    else if (plan === 'Advance') planVal = '2';
                    else if (plan === 'Pro+') planVal = '3';
                    params.append('plan', planVal);
                });
            }

            if (this.activeFilters.stable_capital) params.append('stable_capital', this.activeFilters.stable_capital);
            if (this.activeFilters.profit_min) params.append('profit_min', this.activeFilters.profit_min);
            if (this.activeFilters.credit) {
                if (Array.isArray(this.activeFilters.credit)) {
                     this.activeFilters.credit.forEach(c => params.append('credit', c));
                } else {
                     params.append('credit', this.activeFilters.credit);
                }
            }
            if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
            if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

            if (this.drilldownSort.sortBy) {
                params.append('sort_by', this.drilldownSort.sortBy);
                params.append('sort_dir', this.drilldownSort.sortDir || 'desc');
            }

            const token = localStorage.getItem('moon_office_token');
            const url = `${BASE_URL}/trading-activity/drilldown/export?${params.toString()}`;

            try {
                if (window.Sentry) {
                    Sentry.addBreadcrumb({
                        category: 'export',
                        message: `Starting CSV Export: ${this.selectedLeader}`,
                        level: 'info',
                        data: { url, leader: this.selectedLeader }
                    });
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Export failed');

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                const filename = `Drilldown_TradingActivity_${this.selectedLeader}_${new Date().toISOString().split('T')[0]}.csv`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);

                if (window.Sentry) {
                    Sentry.addBreadcrumb({
                        category: 'export',
                        message: `CSV Export Success: ${filename}`,
                        level: 'info'
                    });
                }
            } catch (error) {
                console.error('Export error:', error);
                if (window.Sentry) {
                    Sentry.captureException(error, { extra: { url, leader: this.selectedLeader } });
                }
                alert('Gagal mendownload data export.');
            }
        },
        exportDrilldownPdf() {
            if (window.Sentry) {
                Sentry.addBreadcrumb({
                    category: 'export',
                    message: `Starting PDF Export: ${this.selectedLeader}`,
                    level: 'info'
                });
            }
            const dataToExport = this.drilldownData.map(item => ({
                Username: item.username || '-',
                Paket: item.vip_level || '-',
                'Active 30D': item.is_active_30d ? 'PASS' : 'FAIL',
                'Profit': item.total_profit || '-',
                'Credit (USDT)': item.wallet_usdt || '-',
                'Stable Capital': item.stableCapital || '-',
                'NO HP': item.msisdn || '-',
                'Coin Group': item.coinGroup || '-',
                MM: item.mm || '-',
                'Max coin': item.maxCoin || '-',
                'DOUBLE EXECUTIVE': item.upper_upline || '-',
                'GOLD': item.upline || '-'
            }));
            JsonToPDF({
                header: ['Username', 'Paket', 'Active 30D', 'Profit', 'credit (USDT)', 'stable capital', 'NO HP', 'coin group', 'MM', 'Max coin', 'DOUBLE EXECUTIVE', 'GOLD'],
                data: dataToExport,
                filename: `Drilldown_TradingActivity_${this.selectedLeader.replace(/\s+/g, '_')}.pdf`,
                title: `Trading Activity - Drilldown ${this.selectedLeader}`
            });
        }
    },
    watch: {
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.drilldownPagination.page = 1;
                this.syncQueryParams();
                this.fetchDrilldown();
            }, 500);
        },
        'filters.dateRange'() {
            this.drilldownPagination.page = 1;
            this.syncQueryParams();
            this.fetchDrilldown();
        },
        'filters.potentialTopUp'() {
            this.drilldownPagination.page = 1;
            this.syncQueryParams();
            this.fetchDrilldown();
        },
        activeFilters: {
            deep: true,
            handler() {
                this.drilldownPagination.page = 1;
                this.syncQueryParams();
                this.fetchDrilldown();
            }
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Trading Activity Drilldown</h1>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center gap-2 mb-6">
                    <button @click="goBack" class="p-1 hover:bg-gray-100 rounded text-teal-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 class="text-xl font-bold text-gray-800">
                        Drilldown Summary - {{ selectedLeader }}
                    </h2>
                </div>

                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                    <div class="flex flex-wrap items-center gap-3 w-full md:w-auto relative">
                        <!-- Date Range Filter -->
                        <div class="relative w-full sm:w-auto">
                            <DatePicker v-model="filters.dateRange" :config="rangePickerConfig">
                                <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                                    <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Timeframe:</span>
                                    <span class="px-4 pb-2 sm:py-2 sm:pl-2 pr-12 text-sm font-medium min-w-[120px] leading-relaxed">{{ filters.dateRange ? filters.dateRange.replace(' to ', ' - ') : 'All Time' }}</span>
                                    <div class="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 flex items-center px-4 text-gray-700">
                                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </DatePicker>
                        </div>
                        <div class="relative">
                            <button @click="toggleFilter" class="filter-trigger h-11 w-11 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none relative z-20">
                                <img src="./assets/images/icons/filter.svg" alt="Filter">
                            </button>
                            <filter-dropdown :is-open="isFilterOpen" :schema="filterSchema" v-model="activeFilters" @close="isFilterOpen = false" @apply="applyFilters"></filter-dropdown>
                        </div>
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search" width="w-full" class="h-full border-gray-200" />
                        </div>
                        <div class="h-11 flex items-center bg-white border border-gray-100 rounded-lg px-3 shadow-sm">
                            <label class="flex items-center cursor-pointer m-0 mb-0">
                                <div class="relative flex items-center">
                                    <input type="checkbox" v-model="filters.potentialTopUp" class="sr-only">
                                    <div class="block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out" :class="filters.potentialTopUp ? 'bg-[#39DEBB]' : 'bg-gray-200'"></div>
                                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform shadow-sm" :class="filters.potentialTopUp ? 'translate-x-4' : 'translate-x-0'"></div>
                                </div>
                                <span class="ml-3 text-sm font-medium text-gray-700 whitespace-nowrap">Potential Top Up</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="exportDrilldown" class="text-gray-400 hover:text-gray-600" title="Export CSV">
                            <img src="./assets/images/icons/download.svg" alt="Download" class="h-6 w-6">
                        </button>
                         
                    </div>
                </div>

                <div v-if="drilldownLoading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                </div>

                <div v-else-if="drilldownError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ drilldownError }}</span>
                    <button @click="fetchDrilldown" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <div v-else>
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

                    <template #cell-is_active_30d="{ value }">
                        <div class="flex justify-center">
                            <span v-if="value === true" class="bg-[#22C55E] text-white p-0.5 rounded shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </span>
                            <span v-else class="text-[#EF4444] font-bold text-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </span>
                        </div>
                    </template>
                    
                    <template #cell-username="{ value }">
                        <a href="#" @click.prevent class="text-[#00A3FF] hover:text-[#0084CC] font-medium no-underline cursor-pointer">{{ value || '-' }}</a>
                    </template>
                    </DataTable>
                </div>
            </div>
        </MainLayout>
    `
};
