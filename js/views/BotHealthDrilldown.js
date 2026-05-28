import MainLayout from '../layouts/MainLayout.js?v=26';
import SearchInput from '../components/SearchInput.js';
import DataTable from '../components/DataTable.js?v=35';
import FilterDropdown from '../components/FilterDropdown.js?v=5';
import { formatNumber, formatRank } from '../utils/formatters.js?v=4'; 
import { fetchApi, BASE_URL } from '../utils/api.js?v=5';
import { decryptQuery, encryptQuery } from '../utils/crypto.js?v=2';

export default {
    name: 'BotHealthDrilldown',
    components: {
        MainLayout,
        SearchInput,
        DataTable,
        FilterDropdown
    },
    data() {
        // Initialize from route query
        const query = decryptQuery(this.$route.query);
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yesterdayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        return {
            leaderName: query.leader || '',
            searchQuery: '',
            filters: {
                date: query.date || yesterdayStr
            },
            drilldownSort: {
                sortBy: query.sort_by || 'days_credit_streak',
                sortDir: query.sort_dir || 'asc'
            },
            loading: false, // For summary
            drilldownLoading: false,
            drilldownError: null,
            isFilterOpen: false,
            activeFilters: {},
            lastUpdated: 'Calculating...',
            leaderUsers: [],
            summary: {
                total_eligible_user: 0,
                insufficient_funds: 0,
                avg_days_off_floating: 0,
                credit_nil: 0,
                avg_days_off_credit: 0,
                health_index: 0
            },
            drilldownPagination: {
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 50,
                totalItems: 0,
                totalPages: 0
            },
            detailColumns: [
                { key: 'username', label: 'USERNAME', sortable: true, thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'PAKET', sortable: true, align: 'center' },
                { key: 'floating', label: 'INSUFFICIENT FUNDS', sortable: true, align: 'center' },
                { key: 'days_floating_streak', label: 'AVG DAYS OFF (FLOATING)', sortable: true, align: 'center' },
                { key: 'insufficient_credit', label: 'CREDIT ≤ 3', sortable: true, align: 'center' },
                { key: 'days_credit_streak', label: 'AVG DAYS OFF (CREDIT)', sortable: true, align: 'center' },
                { key: 'upper_upline', label: 'DOUBLE EXECUTIVE', sortable: true, align: 'center' },
                { key: 'upline', label: 'GOLD', sortable: true, align: 'center' },
                { key: 'step_count', label: 'MM', sortable: true, align: 'center' },
                { key: 'max_coin', label: 'MAX COIN', sortable: true, align: 'center' },
                { key: 'avg_buy_amount', label: 'AVG BUY AMOUNT', sortable: true, align: 'center' },
                { key: 'msisdn', label: 'NO HP', sortable: true, align: 'center' }
            ]
        }
    },
    computed: {
        filterSchema() {
            return [
                {
                    type: 'radio-group',
                    label: 'Funds Status',
                    key: 'funds',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Sufficient', value: 'Sufficient' },
                        { label: 'Insufficient', value: 'Insufficient' }
                    ]
                },
                {
                    type: 'radio-group',
                    label: 'Credit Status',
                    key: 'creditStatus',
                    options: [
                        { label: 'All', value: '' },
                        { label: 'Credit Available', value: 'Credit Available' },
                        { label: 'No Credit Available', value: 'No Credit Available' }
                    ]
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
        if (!this.leaderName) {
            this.$router.push('/bot-health');
            return;
        }
        this.fetchSummary();
        this.fetchDrilldown();
    },
    methods: {
        formatNumber,
        formatRank,
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
        async fetchSummary() {
            try {
                let url = '/bot-health/summary';
                const params = new URLSearchParams();
                
                if (this.filters.date) params.append('date', this.filters.date);
                
                params.append('leader', this.leaderName);
                
                if (this.activeFilters.funds) {
                    if (this.activeFilters.funds.includes('Insufficient')) params.append('floating', '1');
                    else if (this.activeFilters.funds.includes('Sufficient')) params.append('floating', '0');
                }
                if (this.activeFilters.creditStatus) {
                    if (this.activeFilters.creditStatus.includes('No Credit Available')) params.append('credit', '1');
                    else if (this.activeFilters.creditStatus.includes('Credit Available')) params.append('credit', '0');
                }
                if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
                if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);
                
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
        async fetchDrilldown() {
            this.drilldownLoading = true;
            this.drilldownError = null;
            try {
                const params = new URLSearchParams({
                    leader: this.leaderName,
                    page: this.drilldownPagination.page,
                    limit: this.drilldownPagination.limit
                });

                if (this.searchQuery) params.append('search', this.searchQuery);
                if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
                if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

                if (this.drilldownSort.sortBy) {
                    params.append('sort_by', this.drilldownSort.sortBy);
                    params.append('sort_dir', this.drilldownSort.sortDir || 'asc');
                }

                if (this.filters.date) params.append('date', this.filters.date);

                if (this.activeFilters.funds) {
                    if (this.activeFilters.funds.includes('Insufficient')) params.append('floating', '1');
                    else if (this.activeFilters.funds.includes('Sufficient')) params.append('floating', '0');
                }
                if (this.activeFilters.creditStatus) {
                    if (this.activeFilters.creditStatus.includes('No Credit Available')) params.append('credit', '1');
                    else if (this.activeFilters.creditStatus.includes('Credit Available')) params.append('credit', '0');
                }

                const response = await fetchApi(`/bot-health/drilldown?${params.toString()}`);
                if (response.success) {
                    const data = response.data;
                    this.leaderUsers = (data.users || []).map((item, index) => ({
                        id: index + 1,
                        ...item,
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
                console.error('Failed to fetch drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
            } finally {
                this.drilldownLoading = false;
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
        syncQueryParams() {
            const query = { ...decryptQuery(this.$route.query) };
            if (this.searchQuery) query.search = this.searchQuery;
            if (this.filters.date) query.date = this.filters.date;
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
            if (query.date) parentQuery.date = query.date;
            if (query._p_sort_by) parentQuery.sort_by = query._p_sort_by;
            if (query._p_sort_dir) parentQuery.sort_dir = query._p_sort_dir;
            if (query._p_page && query._p_page !== '1') parentQuery.page = query._p_page;
            if (query._p_limit && query._p_limit !== '50') parentQuery.limit = query._p_limit;
            if (query._p_vip_plan && query._p_vip_plan !== 'All') parentQuery.vip_plan = query._p_vip_plan;
            if (query._p_search) parentQuery.search = query._p_search;

            this.$router.push({ name: 'BotHealth', query: encryptQuery(parentQuery) });
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
            this.fetchSummary();
            this.drilldownPagination.page = 1;
            this.fetchDrilldown();
        },
        async handleExport() {
            const params = new URLSearchParams({
                leader: this.leaderName,
                date: this.filters.date || '',
                search: this.searchQuery || ''
            });

            if (this.activeFilters.funds) {
                if (this.activeFilters.funds.includes('Insufficient')) params.append('floating', '1');
                else if (this.activeFilters.funds.includes('Sufficient')) params.append('floating', '0');
            }
            if (this.activeFilters.creditStatus) {
                if (this.activeFilters.creditStatus.includes('No Credit Available')) params.append('credit', '1');
                else if (this.activeFilters.creditStatus.includes('Credit Available')) params.append('credit', '0');
            }
            if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
            if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

            const token = localStorage.getItem('moon_office_token');
            const url = `${BASE_URL}/bot-health/drilldown/export?${params.toString()}`;
            
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
                const filename = `Drilldown_BotHealth_${this.leaderName.replace(/\s+/g, '_')}_${this.filters.date}.csv`;
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
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.drilldownPagination.page = 1;
                this.syncQueryParams();
                this.fetchDrilldown();
            }, 500);
        },
        filters: {
            deep: true,
            handler() {
                this.drilldownPagination.page = 1;
                this.syncQueryParams();
                this.fetchSummary();
                this.fetchDrilldown();
            }
        },
        activeFilters: {
            deep: true,
            handler() {
                this.syncQueryParams();
            }
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Bot Health Drilldown</h1>
                <div class="text-xs text-gray-500 italic">
                    {{ lastUpdated }}
                </div>
            </div>

            <!-- Header Stats -->
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
                 <div class="mb-6 flex items-center gap-2">
                    <button @click="goBack" class="text-blue-500 hover:text-blue-700 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 class="text-lg font-bold text-gray-900">
                        Leader - {{ leaderName }}
                    </h2>
                </div>

                <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                    <div class="flex flex-wrap items-center gap-4 w-full md:w-auto"> 
                        <div class="relative">
                            <button @click="toggleFilter" class="filter-trigger h-11 w-11 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none relative z-20">
                                <img src="./assets/images/icons/filter.svg" alt="Filter">
                            </button>
                            <filter-dropdown :is-open="isFilterOpen" :schema="filterSchema" v-model="activeFilters" @close="isFilterOpen = false" @apply="applyFilters"></filter-dropdown>
                        </div>
                        <div class="w-full md:w-64 h-11">
                            <SearchInput v-model="searchQuery" placeholder="Search Username" width="w-full" class="h-full border-gray-200" />
                        </div>
                    </div>
                    <button @click="handleExport" class="text-gray-400 hover:text-gray-600" title="Export Drilldown">
                        <img src="./assets/images/icons/download.svg" alt="Download" class="h-6 w-6">
                    </button>
                </div>

                <div v-if="drilldownLoading" class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                    <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                </div>

                <div v-else-if="drilldownError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                    <span>{{ drilldownError }}</span>
                    <button @click="fetchDrilldown" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                </div>

                <DataTable 
                    v-else
                    key="drilldown-table"
                    :columns="detailColumns" 
                    :data="leaderUsers"
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
                    <template #cell-username="{ value }">
                        <a href="#" @click.prevent class="text-[#00A3FF] hover:text-[#0084CC] font-medium no-underline cursor-pointer">{{ value || '-' }}</a>
                    </template>
                    <template #cell-vip_level="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ value === 0 || value === 1 ? 'B+' : (value === 2 ? 'A+' : 'P+') }}</span>
                        </div>
                    </template>
                    <template #cell-max_coin="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>
                    <template #cell-floating="{ value }">
                        <div class="flex justify-center">
                            <span v-if="value == 0 || value == '0'" class="text-green-500 font-bold text-sm">NO</span>
                            <span v-else class="text-red-500 font-bold text-sm">YES</span>
                        </div>
                    </template>
                    <template #cell-days_floating_streak="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>
                    <template #cell-insufficient_credit="{ value }">
                        <div class="flex justify-center">
                            <span v-if="value == 0 || value == '0'" class="text-green-500 font-bold text-sm">NO</span>
                            <span v-else class="text-red-500 font-bold text-sm">YES</span>
                        </div>
                    </template>
                    <template #cell-days_credit_streak="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>
                    <template #cell-step_count="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value||0) }}</span>
                        </div>
                    </template>
                    <template #cell-avg_buy_amount="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ formatNumber(value) }}</span>
                        </div>
                    </template>
                    <template #cell-upper_upline="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ value || '-' }}</span>
                        </div>
                    </template>
                    <template #cell-upline="{ value }">
                        <div class="flex justify-center">
                            <span class="text-gray-700">{{ value || '-' }}</span>
                        </div>
                    </template>
                </DataTable>
            </div>
        </MainLayout>
    `
};
