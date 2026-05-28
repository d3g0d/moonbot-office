import MainLayout from '../layouts/MainLayout.js?v=26';
import SearchInput from '../components/SearchInput.js';
import DataTable from '../components/DataTable.js?v=35';
import FilterDropdown from '../components/FilterDropdown.js?v=5';
import DatePicker from '../components/DatePicker.js?v=3';
import { formatNumber, formatRank, leaderRankLabels } from '../utils/formatters.js?v=4'; 
import { fetchApi, BASE_URL } from '../utils/api.js?v=5';
import { encryptQuery, decryptQuery } from '../utils/crypto.js?v=2';
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
        const query = decryptQuery(this.$route.query);
        let leaderValue = query.leader || 'All';
        if (leaderValue !== 'All' && !leaderValue.includes('⭐')) {
            leaderValue = leaderValue + ' ⭐';
        }
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yesterdayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        return {
            searchQuery: query.search || '',
            filters: {
                date: query.date || yesterdayStr,
                leader: leaderValue,
                vipPlan: query.vip_plan || 'All'
            },
            sort: {
                sortBy: query.sort_by || 'health_index',
                sortDir: query.sort_dir || 'desc'
            },
            loading: false,
            error: null,
            isFilterOpen: false,
            activeFilters: query.vip_plan ? { vipPlan: query.vip_plan } : {},
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
            botHealthData: [],
            summary: {
                total_eligible_user: 0,
                insufficient_funds: 0,
                avg_days_off_floating: 0,
                credit_nil: 0,
                avg_days_off_credit: 0,
                health_index: 0
            },
            pagination: {
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 50,
                totalItems: 0,
                totalPages: 0
            },
            leaderRankLabels
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
        },
        summaryStats() {
            return [
                { label: 'Floating', value: formatNumber(this.summary.insufficient_funds??0), suffix: ` (${this.summary.floating_pct??0}%)` },
                { label: 'Avg days OFF (floating)', value: formatNumber(this.summary.avg_days_off_floating??0) },
                { label: 'Credit NIL', value: formatNumber(this.summary.credit_nil??0), suffix: ` (${this.summary.credit_nil_pct??0}%)` },
                { label: 'Avg days OFF (credit)', value: formatNumber(this.summary.avg_days_off_credit??0) },
                { label: 'Total Eligible User', value: formatNumber(this.summary.total_eligible_user??0) },
                { label: 'Health Index', value: this.summary.health_index??0 }
            ];
        }
    },
    mounted() {
        this.fetchSummary();
        this.fetchBotHealth();
    },
    methods: {
        formatNumber,
        formatRank,
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.syncQueryParams();
            this.fetchBotHealth();
        },
        handleSortChange({ key, order }) {
            this.sort.sortBy = key;
            this.sort.sortDir = order;
            this.pagination.page = 1;
            this.syncQueryParams();
            this.fetchBotHealth();
        },
        async fetchSummary() {
            try {
                let url = '/bot-health/summary';
                const params = new URLSearchParams();
                
                if (this.filters.date) params.append('date', this.filters.date);
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rank = this.filters.leader.split(' ')[0];
                    params.append('rank', rank);
                }

                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }
                
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await fetchApi(url);
                if (response.success && response.data && response.data.summary) {
                    const snapshot = response.data.summary;
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
                    
                    if (response.data.stat_date) {
                        this.lastUpdated = `Stats for ${this.formatDate(response.data.stat_date)}`;
                    } else {
                        this.lastUpdated = 'Live Stats';
                    }
                }
            } catch (err) {
                console.error('Failed to fetch summary:', err);
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
                
                if (this.searchQuery) params.append('exact_leader', this.searchQuery);
                if (this.filters.date) params.append('date', this.filters.date);
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rank = this.filters.leader.split(' ')[0];
                    params.append('rank', rank);
                }
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                if (this.sort.sortBy) {
                    params.append('sort_by', this.sort.sortBy);
                    params.append('sort_dir', this.sort.sortDir || 'desc');
                }

                const response = await fetchApi(`/bot-health/leaders?${params.toString()}`);
                if (response.success && response.data) {
                    const data = response.data;
                    this.botHealthData = data.summaries || [];
                    if (data.pagination) {
                        this.pagination.totalItems = data.pagination.total || 0;
                        this.pagination.totalPages = data.pagination.total_pages || 0;
                        this.pagination.page = data.pagination.current_page || 1;
                        this.pagination.limit = data.pagination.limit || 25;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch leaders:', err);
                this.error = 'Failed to load data.';
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
        selectLeader(row) {
            const parentState = {
                _p_leader: this.filters.leader !== 'All' ? this.filters.leader.replace(' ⭐', '') : 'All',
                _p_vip_plan: this.filters.vipPlan,
                _p_sort_by: this.sort.sortBy,
                _p_sort_dir: this.sort.sortDir,
                _p_page: this.pagination.page,
                _p_limit: this.pagination.limit,
                _p_search: this.searchQuery || ''
            };
            this.$router.push({
                name: 'BotHealthDrilldown',
                query: encryptQuery({
                    leader: row.leader,
                    date: this.filters.date,
                    ...parentState
                })
            });
        },
        syncQueryParams() {
            const query = {};
            if (this.filters.leader && this.filters.leader !== 'All') {
                query.leader = this.filters.leader.replace(' ⭐', '');
            }
            if (this.filters.date) query.date = this.filters.date;
            if (this.sort.sortBy && this.sort.sortBy !== 'health_index') query.sort_by = this.sort.sortBy;
            if (this.sort.sortDir && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.sort.sortBy === 'health_index' && this.sort.sortDir !== 'desc') query.sort_dir = this.sort.sortDir;
            if (this.pagination.page > 1) query.page = this.pagination.page;
            if (this.pagination.limit !== 50) query.limit = this.pagination.limit;
            if (this.filters.vipPlan && this.filters.vipPlan !== 'All') query.vip_plan = this.filters.vipPlan;
            if (this.searchQuery) query.search = this.searchQuery;
            
            this.$router.replace({ query: encryptQuery(query) }).catch(() => {});
        },
        getHealthIndexClass(value) {
            const val = parseFloat(value);
            if (val > 0.8) return 'bg-[#39DEBB] text-white';
            if (val >= 0.6) return 'bg-[#F9B33F] text-white';
            return 'bg-[#F24E6C] text-white';
        },
        getHealthIndexTextClass(value) {
            const val = parseFloat(value);
            if (val > 0.8) return 'text-[#39DEBB]';
            if (val >= 0.6) return 'text-[#F9B33F]';
            return 'text-[#F24E6C]';
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        applyFilters() {
            this.isFilterOpen = false;
            this.pagination.page = 1;
            this.syncQueryParams();
            this.fetchSummary();
            this.fetchBotHealth();
        }
    },
    watch: {
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchBotHealth();
            }, 500);
        },
        filters: {
            deep: true,
            handler() {
                this.pagination.page = 1;
                this.syncQueryParams();
                this.fetchSummary();
                this.fetchBotHealth();
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

            <!-- Global Filters -->
            <div class="flex flex-wrap items-center gap-3 mb-8">
                <!-- Date Filter -->
                <div class="relative w-full sm:w-auto">
                    <DatePicker v-model="filters.date" :config="datePickerConfig">
                        <div class="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 text-gray-700 rounded-2xl sm:rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                            <span class="px-4 pt-2 sm:py-2 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Date:</span>
                            <span class="px-4 pb-2 sm:py-2 sm:pl-2 pr-12 text-sm font-medium min-w-[120px] leading-relaxed">{{ filters.date }}</span>
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

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap mb-6 py-1 overflow-x-auto custom-scrollbar">
                <div v-for="(stat, index) in summaryStats" :key="index" 
                    class="flex-1 min-w-[150px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                    <div class="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide whitespace-nowrap">{{ stat.label }}</div>
                    <div :class="['text-sm lg:text-base font-bold whitespace-nowrap', stat.label === 'Health Index' ? getHealthIndexTextClass(stat.value) : 'text-gray-900']">
                        {{ stat.value }}{{ stat.suffix || '' }}
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6">
                 <div class="mb-6">
                    <h2 class="text-lg font-bold text-gray-900">Bot Health Analysis by Leader</h2>
                </div>

                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                    <div class="flex flex-wrap items-center gap-4 w-full md:w-auto"> 
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search Leader" width="w-full" class="h-full border-gray-200" />
                        </div>
                    </div>
                </div>

                <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading bot health data...</p>
                </div>

                <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ error }}</span>
                    <button @click="fetchBotHealth" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <DataTable 
                    v-else
                    :columns="columns" 
                    :data="botHealthData"
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
                    <template #cell-leader="{ value, row }">
                         <span @click="selectLeader(row)" class="text-[#00A3FF] cursor-pointer hover:text-blue-600">
                            {{ value }}
                        </span>
                    </template>

                    <template #cell-insufficient_funds="{ value, row }">
                        <div class="flex flex-col items-center">
                            <span class="text-gray-900 font-medium">{{ formatNumber(value) }}</span>
                            <span v-if="row.insufficient_funds_pct !== undefined" class="text-xs text-gray-400">({{ row.insufficient_funds_pct }}%)</span>
                        </div>
                    </template>

                     <template #cell-credit_nil="{ value, row }">
                        <div class="flex flex-col items-center">
                            <span class="text-gray-900 font-medium">{{ formatNumber(value) }}</span>
                            <span v-if="row.credit_nil_pct !== undefined" class="text-xs text-gray-400">({{ row.credit_nil_pct }}%)</span>
                        </div>
                    </template>

                    <template #cell-avg_days_off_floating="{ value }">
                        <div class="flex justify-center"><span class="text-gray-500">{{ formatNumber(value) }}</span></div>
                    </template>

                    <template #cell-avg_days_off_credit="{ value }">
                        <div class="flex justify-center"><span class="text-gray-500">{{ formatNumber(value) }}</span></div>
                    </template>

                    <template #cell-total_users="{ value }">
                        <div class="flex justify-center"><span class="text-gray-500">{{ formatNumber(value) }}</span></div>
                    </template>

                    <template #cell-health_index="{ value }">
                        <div v-if="value !== null && value !== undefined" class="flex justify-center">
                             <span :class="['text-xs font-medium px-2 py-1 rounded', getHealthIndexClass(value)]">{{ value }}</span>
                        </div>
                        <div v-else class="flex justify-center"><span class="text-gray-400">-</span></div>
                    </template>
                </DataTable>

                 <div class="mt-6 flex flex-wrap justify-end gap-6 text-xs text-gray-600">
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
