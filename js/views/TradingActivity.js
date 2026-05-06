import MainLayout from '../layouts/MainLayout.js?v=25';
import DataTable from '../components/DataTable.js?v=34';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=3';
import DatePicker from '../components/DatePicker.js?v=2';
import { formatNumber, formatRank, leaderRankLabels, getDefaultDateRange } from '../utils/formatters.js?v=3';
import { fetchApi, BASE_URL } from '../utils/api.js?v=4';
import { encryptQuery, decryptQuery } from '../utils/crypto.js?v=1';

export default {
    name: 'TradingActivity',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        FilterDropdown,
        DatePicker
    },
    data() {
        const query = decryptQuery(this.$route.query);
        let leaderValue = query.leader || 'All';
        if (leaderValue !== 'All' && !leaderValue.includes('⭐')) {
            leaderValue = leaderValue + ' ⭐';
        }
        return {
            lastUpdated: 'Live Stats',
            filters: {
                dateRange: query.dateRange || getDefaultDateRange(), // Stores "YYYY-MM-DD to YYYY-MM-DD"
                vipPlan: query.vipPlan || 'All',
                leader: leaderValue
            },
            stats: [
                { label: 'Active ≥ 30D', value: 0, isPercentage: true },
                { label: 'Active User', value: 0 },
                { label: 'Total User', value: 0 },
                { label: 'Total Volume', value: 0, isCurrency: true },
                { label: 'Total Profit', value: 0, isCurrency: true },
                { label: 'Avg. Profit/user', value: 0, isCurrency: true },
                { label: 'Potential Top Up', value: 0 }
            ],
            searchQuery: query.search || '',
            loading: false,
            error: null,
            pagination: {
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 50,
                totalItems: 0,
                totalPages: 0
            },
            sort: {
                sortBy: query.sort_by || 'potential_top_up',
                sortDir: query.sort_dir || 'desc'
            },
            columns: [
                { key: 'leader', label: 'LEADER', sortable: true,
                    thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'active_rate_pct', label: 'ACTIVE ≥ 30D', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'active_user', label: 'ACTIVE USER', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'total_user', label: 'TOTAL USER', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'total_volume', label: 'TOTAL VOLUME', sortable: true, colWidth: '150px' },
                { key: 'total_profit', label: 'TOTAL PROFIT', sortable: true, colWidth: '150px' },
                { key: 'avg_profit_user', label: 'AVG PROFIT/USER', sortable: true, colWidth: '150px' },
                { key: 'potential_top_up', label: 'POTENTIAL TOP UP', sortable: true, align: 'center', colWidth: '150px' }
            ],
            leaders: [],
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
            leaderRankLabels
        }
    },
    computed: {
        filteredLeaders() {
            return this.leaders;
        }
    },
    methods: {
        formatNumber,
        formatRank,
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.syncQueryParams();
            this.fetchLeaders();
        },
        handleSortChange({ key, order }) {
            this.sort.sortBy = key;
            this.sort.sortDir = order;
            this.pagination.page = 1;
            this.syncQueryParams();
            this.fetchLeaders();
        },
        formatStat(stat) {
            if (stat.isCurrency) return formatNumber(stat.value, { prefix: '$ ' });
            if (stat.isPercentage) return formatNumber(stat.value, { suffix: '%' });
            return formatNumber(stat.value);
        },
        async fetchSnapshot() {
            try {
                let url = '/trading-activity/summary';
                const params = new URLSearchParams();
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rankNum = this.filters.leader.split(' ')[0];
                    params.append('rank', rankNum);
                }
                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    }
                }
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }
                const response = await fetchApi(url);
                if (response.success && response.data) {
                    const data = response.data;
                    this.stats = [
                        { label: 'Active ≥ 30D', value: data.active_rate_pct || 0, isPercentage: true },
                        { label: 'Active User', value: data.active_user || 0 },
                        { label: 'Total User', value: data.total_user || 0 },
                        { label: 'Total Volume', value: data.total_volume || 0, isCurrency: true },
                        { label: 'Total Profit', value: data.total_profit || 0, isCurrency: true },
                        { label: 'Avg. Profit/user', value: data.avg_profit_user || 0, isCurrency: true },
                        { label: 'Potential Top Up', value: data.potential_top_up || 0 }
                    ];
                    if (data.start_date && data.end_date) {
                        this.lastUpdated = `${data.start_date} to ${data.end_date}`;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch snapshot:', err);
                if (window.Sentry) Sentry.captureException(err, { category: 'snapshot' });
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
                if (this.searchQuery) params.append('exact_leader', this.searchQuery);
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rankNum = this.filters.leader.split(' ')[0];
                    params.append('rank', rankNum);
                }
                if (this.sort.sortBy) {
                    params.append('sort_by', this.sort.sortBy);
                    params.append('sort_dir', this.sort.sortDir || 'desc');
                }

                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    }
                }

                const response = await fetchApi(`/trading-activity/leaders?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.leaders = (data.leaders || []).map(item => ({
                        leader: item.leader,
                        active_rate_pct: item.active_rate_pct !== undefined ? item.active_rate_pct + '%' : '0%',
                        active_user: formatNumber(item.active_user || 0),
                        total_user: formatNumber(item.total_user || 0),
                        total_volume: formatNumber(item.total_volume || 0, { prefix: '$ ' }),
                        total_profit: formatNumber(item.total_profit || 0, { prefix: '$ ' }),
                        avg_profit_user: formatNumber(item.avg_profit_user || 0, { prefix: '$ ' }),
                        potential_top_up: formatNumber(item.potential_top_up || 0)
                    }));
                    if (data.pagination) {
                        this.pagination.totalItems = data.pagination.total || 0;
                        this.pagination.totalPages = data.pagination.total_pages || 0;
                        this.pagination.page = data.pagination.current_page || 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch trading activity leaders:', err);
                this.error = 'Failed to load trading activity data.';
                if (window.Sentry) Sentry.captureException(err, { category: 'leaders_fetch' });
            } finally {
                this.loading = false;
            }
        },
        selectLeader(leaderName) {
            if (window.Sentry) {
                Sentry.addBreadcrumb({
                    category: 'navigation',
                    message: `Selecting Leader for Drilldown: ${leaderName}`,
                    level: 'info',
                    data: { leader: leaderName }
                });
            }
            const parentState = {
                _p_leader: this.filters.leader !== 'All' ? this.filters.leader.replace(' ⭐', '') : 'All',
                _p_vipPlan: this.filters.vipPlan,
                _p_dateRange: this.filters.dateRange,
                _p_sort_by: this.sort.sortBy,
                _p_sort_dir: this.sort.sortDir,
                _p_page: this.pagination.page,
                _p_limit: this.pagination.limit,
                _p_search: this.searchQuery || ''
            };
            this.$router.push({
                name: 'TradingActivityDrilldown',
                query: encryptQuery({
                    leader: leaderName,
                    dateRange: this.filters.dateRange,
                    ...parentState
                })
            });
        },
        syncQueryParams() {
            const query = {};
            if (this.filters.leader && this.filters.leader !== 'All') {
                query.leader = this.filters.leader.replace(' ⭐', '');
            }
            if (this.filters.vipPlan && this.filters.vipPlan !== 'All') query.vipPlan = this.filters.vipPlan;
            if (this.filters.dateRange) query.dateRange = this.filters.dateRange;
            if (this.sort.sortBy && this.sort.sortBy !== 'potential_top_up') query.sort_by = this.sort.sortBy;
            if (this.sort.sortDir && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.sort.sortBy === 'potential_top_up' && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.pagination.page > 1) query.page = this.pagination.page;
            if (this.pagination.limit !== 50) query.limit = this.pagination.limit;
            if (this.searchQuery) query.search = this.searchQuery;
            
            this.$router.replace({ query: encryptQuery(query) }).catch(() => {});
        }
    },
    watch: {
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchLeaders();
            }, 500);
        },
        filters: {
            deep: true,
            handler() {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchSnapshot();
                this.fetchLeaders();
            }
        }
    },
    mounted() {
        this.fetchSnapshot();
        this.fetchLeaders();
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Trading Activity</h1>
                <div class="text-xs text-gray-500 italic">
                    Last Updated: {{ lastUpdated }}
                </div>
            </div>

            <!-- Global Filters -->
            <div class="flex flex-wrap items-center gap-3 mb-8">
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
                <!-- Leader Rank Filter -->
                 <div class="relative w-full sm:w-auto">
                    <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                        <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Leader :</span>
                        <select v-model="filters.leader" class="appearance-none bg-transparent px-4 pb-2 sm:py-2 sm:pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                            <option value="All">All</option>
                            <option v-for="n in 11" :key="n" :value="n + ' ⭐'">{{ leaderRankLabels[n] }}</option>
                        </select>
                        <div class="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 flex items-center px-4 text-gray-700">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
                 <!-- VIP Plan Filter -->
                 <div class="relative w-full sm:w-auto">
                    <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                        <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">VIP Plan :</span>
                        <select v-model="filters.vipPlan" class="appearance-none bg-transparent px-4 pb-2 sm:py-2 sm:pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                            <option value="All">All</option>
                            <option value="1">B+</option>
                            <option value="2">A+</option>
                            <option value="3">P+</option>
                        </select>
                        <div class="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 flex items-center px-4 text-gray-700">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats/Metrics Cards -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap mb-8 py-2 overflow-x-auto custom-scrollbar">
                <div v-for="(stat, index) in stats" :key="index" class="flex-1 min-w-[150px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                    <div class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">{{ stat.label }}</div>
                    <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ formatStat(stat) }}</div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6">
                    <div class="w-full md:w-64 h-11">
                        <SearchInput v-model="searchQuery" placeholder="Leader" width="w-full" class="h-full border-gray-100" />
                    </div>
                </div>

                <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading trading activity data...</p>
                </div>

                <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ error }}</span>
                    <button @click="fetchLeaders" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <div v-else class="bg-white p-2">
                    <DataTable 
                        key="leaders-table"
                        :columns="columns" 
                        :data="filteredLeaders"
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
                        <template #action-header><th></th></template>

                        <template #cell-leader="{ value }">
                            <span 
                                @click="selectLeader(value)"
                                class="text-[#00A3FF] cursor-pointer hover:text-blue-600 font-medium">
                                {{ value }}
                            </span>
                        </template>

                        <template #row-actions></template>
                    </DataTable>
                </div>
            </div>
        </MainLayout>
    `
};
