import MainLayout from '../layouts/MainLayout.js?v=25';
import DataTable from '../components/DataTable.js?v=34';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=4';
import DatePicker from '../components/DatePicker.js?v=2';
import { formatRank, formatPercentWithDays, formatNumber } from '../utils/formatters.js';
import { fetchApi, BASE_URL } from '../utils/api.js?v=4';

export default {
    name: 'Pipeline',
    components: {
        MainLayout,
        DataTable,
        SearchInput,
        FilterDropdown,
        DatePicker
    },
    data() {
        const query = this.$route.query;
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
                    (typeof monthSelectPlugin !== 'undefined' || (typeof flatpickr !== 'undefined' && flatpickr.plugins && flatpickr.plugins.monthSelect)) ? 
                    new (monthSelectPlugin || flatpickr.plugins.monthSelect)({
                        shorthand: true,
                        dateFormat: "Y-m",
                        altFormat: "M Y",
                        theme: "light"
                    }) : null
                ].filter(Boolean)
            },
            sort: {
                sortBy: query.sort_by || 'bot_run_pct',
                sortDir: query.sort_dir || 'desc'
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
                { key: 'total_join', label: 'JOIN', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'activate_pct', label: 'ACTIVATE', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'api_bind_pct', label: 'API BIND', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'credit_pct', label: 'CREDIT', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'bot_run_pct', label: 'BOT RUN', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'avg_lead_time_days', label: 'AVERAGE LEAD TIME', sortable: true, align: 'center', colWidth: '150px' }
            ],
            pipelineData: [],
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
        },
        filteredLeaders() {
            return this.pipelineData;
        }
    },
    watch: {
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination.page = 1;
                this.fetchSummary();
                this.fetchLeaders();
            }, 500);
        },
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
        handlePageChange({ page, rowsPerPage }) {
            this.pagination.page = page;
            this.pagination.limit = rowsPerPage;
            this.fetchLeaders();
        },
        handleSortChange({ key, order }) {
            this.sort.sortBy = key;
            this.sort.sortDir = order;
            this.pagination.page = 1;
            this.fetchLeaders();
        },
        async fetchSummary() {
            try {
                const params = new URLSearchParams();
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rank = this.filters.leader.split(' ')[0];
                    params.append('rank', rank);
                }
                if (this.filters.month) {
                    const [year, month] = this.filters.month.split('-');
                    params.append('join_month', parseInt(month).toString());
                    params.append('join_year', year);
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
                    if (data.conversion || data.lead_time) {
                        this.summary = {
                            total_join: data.total_join || 0,
                            conversion: data.conversion || {
                                join: { pct: 100 }, activate: { pct: 0 }, api_bind: { pct: 0 }, credit: { pct: 0 }, bot_run: { pct: 0 }
                            },
                            lead_time: data.lead_time || {
                                activate: 0, api_bind: 0, credit: 0, bot_run: 0
                            }
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
                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rank = this.filters.leader.split(' ')[0];
                    params.append('rank', rank);
                }
                if (this.filters.month) {
                    const [year, month] = this.filters.month.split('-');
                    params.append('join_month', parseInt(month).toString());
                    params.append('join_year', year);
                }
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }
                if (this.searchQuery) params.append('exact_leader', this.searchQuery);
                if (this.sort.sortBy) {
                    params.append('sort_by', this.sort.sortBy);
                    params.append('sort_dir', this.sort.sortDir || 'desc');
                }

                const response = await fetchApi(`/pipeline/leaders?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.pipelineData = (data.leaders || []).map((item, index) => ({
                        id: (this.pagination.page - 1) * this.pagination.limit + index + 1,
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
        selectLeader(leaderName) {
            this.$router.push({
                name: 'PipelineDrilldown',
                query: {
                    leader: leaderName,
                    month: this.filters.month
                }
            });
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
        getBotRunClass(value) {
            const val = parseFloat(value);
            if (isNaN(val)) return 'px-2 py-1 bg-gray-100 text-gray-400 rounded-lg font-bold min-w-[60px] inline-block text-center';
            if (val > 85) return 'px-2 py-1 bg-[#22C55E] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm'; // performa bagus
            if (val >= 60) return 'px-2 py-1 bg-[#F9B33F] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm'; // butuh perhatian
            return 'px-2 py-1 bg-[#EF4444] text-white rounded-lg font-bold min-w-[60px] inline-block text-center shadow-sm'; // titik lemah
        },
        getBotRunTextClass(value) {
            const val = parseFloat(value);
            if (isNaN(val)) return 'text-gray-900';
            if (val > 85) return 'text-[#22C55E]'; // performa bagus
            if (val >= 60) return 'text-[#F9B33F]'; // butuh perhatian
            return 'text-[#EF4444]'; // titik lemah
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Pipeline</h1>
            </div>

            <!-- Global Filters -->
            <div class="flex flex-wrap items-center gap-3 mb-8">
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
                            <option v-for="n in 11" :key="n" :value="n + ' ⭐'">{{ n }} ⭐</option>
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

            <!-- Average Conversion section -->
            <div class="mb-8">
                <div class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Average Conversion <span class="text-gray-400 font-normal normal-case">(by VIP plan)</span></div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap py-1 overflow-x-auto custom-scrollbar">
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Join</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.join.pct }}%</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Activate</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.activate.pct }}%</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">API Bind</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.api_bind.pct }}%</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Credit</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.conversion.credit.pct }}%</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Bot Run</div>
                        <div :class="['text-sm lg:text-base font-bold whitespace-nowrap', getBotRunTextClass(summary.conversion.bot_run.pct)]">{{ summary.conversion.bot_run.pct }}%</div>
                    </div>
                </div>
            </div>

            <!-- Average Lead Time section -->
            <div class="mb-8">
                <div class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Average Lead Time <span class="text-gray-400 font-normal normal-case">(by VIP plan)</span></div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap py-1 overflow-x-auto custom-scrollbar">
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Activate</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.activate }} days</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">API Bind</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.api_bind }} days</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Credit</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.credit }} days</div>
                    </div>
                    <div class="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4  text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">Bot Run</div>
                        <div class="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">{{ summary.lead_time.bot_run }} days</div>
                    </div>
                </div>
            </div>

            <!-- Table Section -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex flex-wrap md:flex-nowrap justify-start items-center mb-6">
                    <div class="w-full md:w-64 h-11">
                        <SearchInput v-model="searchQuery" placeholder="Leaders" width="w-full" class="h-full border-gray-200" />
                    </div>
                </div>

                <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading pipeline data...</p>
                </div>

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
                        :sort-by="sort.sortBy"
                        :sort-order="sort.sortDir"
                        @page-change="handlePageChange"
                        @sort-change="handleSortChange"
                    >
                        <template #action-header><th></th></template>

                        <template #cell-leader="{ value }">
                            <span @click="selectLeader(value)" class="text-[#00A3FF] hover:text-blue-600 font-medium cursor-pointer">
                                {{ value || '-' }}
                            </span>
                        </template>

                        <template #cell-total_join="{ value }">
                            <div class="flex justify-center">
                                <span class="text-gray-700">{{ value !== null && value !== undefined ? formatNumber(value) : '-' }}</span>
                            </div>
                        </template>
\t\t\t\t\t\t\t
                        <template #cell-activate_pct="{ value }">
                            <div class="flex justify-center">
                                <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                            </div>
                        </template>

                        <template #cell-api_bind_pct="{ value }">
                            <div class="flex justify-center">
                                <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                            </div>
                        </template>

                        <template #cell-credit_pct="{ value }">
                            <div class="flex justify-center">
                                <span class="text-gray-700">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                            </div>
                        </template>

                        <template #cell-bot_run_pct="{ value }">
                            <div class="flex justify-center">
                                <span :class="getBotRunClass(value)">{{ value !== null && value !== undefined ? value + '%' : '-' }}</span>
                            </div>
                        </template>

                        <template #cell-avg_lead_time_days="{ value }">
                            <div class="flex justify-center">
                                <span class="text-gray-700">{{ value !== null && value !== undefined ? value + ' days' : '-' }}</span>
                            </div>
                        </template>

                        <template #row-actions></template>

                        <template #cell-id="{ value }">
                            <span class="text-gray-500 font-medium whitespace-nowrap px-2">{{ value }}</span>
                        </template>
                    </DataTable>
                </div>
            </div>
        </MainLayout>
    `
};
