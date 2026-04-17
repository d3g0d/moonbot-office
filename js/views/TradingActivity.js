import MainLayout from '../layouts/MainLayout.js?v=24';
import DataTable from '../components/DataTable.js?v=33';
import SearchInput from '../components/SearchInput.js';
import FilterDropdown from '../components/FilterDropdown.js?v=3';
import DatePicker from '../components/DatePicker.js?v=2';
import { formatNumber, JsonToCSV, JsonToPDF } from '../utils/formatters.js';
import { fetchApi, BASE_URL } from '../utils/api.js?v=4';

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
        return {
            lastUpdated: '11/2/2026 08:00 PM (GMT+7)',
            filters: {
                dateRange: '', // Stores "YYYY-MM-DD to YYYY-MM-DD"
                vipPlan: 'All',
                leader: 'All'
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
            searchQuery: '',
            loading: false,
            error: null,
            pagination: {
                page: 1,
                limit: 25,
                totalItems: 0,
                totalPages: 0
            },
            sort: {
                sortBy: '',
                sortDir: 'desc'
            },
            drilldownLoading: false,
            drilldownError: null,
            drilldownPagination: {
                page: 1,
                limit: 50,
                totalItems: 0,
                totalPages: 0
            },
            drilldownSort: {
                sortBy: '',
                sortDir: 'desc'
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
            selectedLeader: null,
            drilldownColumns: [
                { key: 'username', label: 'Username', sortable: true , thClass: 'sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words',
                    class: 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words'},
                { key: 'vip_level', label: 'Paket', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'is_active_30d', label: 'Active 30D', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'total_profit', label: 'Profit (ALL TIME)', sortable: true, colWidth: '150px' },
                { key: 'wallet_usdt', label: 'credit (USDT)', sortable: true, colWidth: '150px' },
                { key: 'stableCapital', label: 'stable capital', sortable: true, colWidth: '150px' },
                { key: 'msisdn', label: 'NO HP', sortable: true, class: 'whitespace-nowrap', colWidth: '150px' },
                { key: 'coinGroup', label: 'coin group', sortable: true, align: 'center', colWidth: '120px' },
                { key: 'mm', label: 'MM', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'maxCoin', label: 'Max coin', sortable: true, align: 'center', colWidth: '100px' },
                { key: 'upper_upline', label: 'UPLINE RANK 6', sortable: true, align: 'center', colWidth: '150px' },
                { key: 'upline', label: 'UPLINE RANK 3', sortable: true, align: 'center', colWidth: '150px' }
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
                    label: 'Upline rank 3',
                    key: 'upline',
                    placeholder: 'Username'
                },
                {
                    type: 'text',
                    label: 'Upline rank 6',
                    key: 'upper_upline',
                    placeholder: 'Username'
                }
            ],
            datePickerConfig: {
                plugins: [
                    // Ensure plugin exists before using
                    typeof monthSelectPlugin !== 'undefined' ? new monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "M y",
                        altFormat: "M y",
                        theme: "light"
                    }) : null
                ].filter(Boolean)
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
                            Swal.fire({
                                icon: 'warning',
                                title: 'Date Range Limit',
                                text: 'Maximum date range is 90 days',
                                confirmButtonColor: '#39DEBB'
                            });
                            instance.clear();
                        }
                    }
                },
                onReady: (selectedDates, dateStr, instance) => {
                    const container = instance.calendarContainer;
                    if (!container) return;
                    
                    // Check if already has actions div to avoid duplicates
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
            }
        }
    },
    computed: {
        filteredLeaders() {
            return this.leaders;
        },
        filteredDrilldownData() {
            return this.drilldownData;
        }
    },
    methods: {
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
        handleDrilldownPageChange({ page, rowsPerPage }) {
            this.drilldownPagination.page = page;
            this.drilldownPagination.limit = rowsPerPage;
            this.fetchDrilldown(this.selectedLeader);
        },
        handleDrilldownSortChange({ key, order }) {
            this.drilldownSort.sortBy = key;
            this.drilldownSort.sortDir = order;
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(this.selectedLeader);
        },
        formatDate(dateStr) {
            if (!dateStr) return '-';
            try {
                // Handle YYYY-MM-DD or other formats
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
        formatStat(stat) {
            if (stat.isCurrency) return formatNumber(stat.value, { prefix: '$ ' });
            if (stat.isPercentage) return formatNumber(stat.value, { suffix: '%' });
            return formatNumber(stat.value);
        },
        async fetchSnapshot() {
            try {
                let url = '/trading-activity/summary';
                const params = new URLSearchParams();
                
                // Add VIP Plan (plan)
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rankNum = this.filters.leader.split(' ')[0];
                    params.append('rank', rankNum);
                }

                // Add Date Range
                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    } else if (dates.length === 1) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[0]);
                    }
                } else {
                    params.append('start_date', '');
                    params.append('end_date', '');
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
                    } else if (data.end_date) {
                        this.lastUpdated = `Until ${data.end_date}`;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch snapshot:', err);
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
                
                if (this.searchQuery) params.append('leader', this.searchQuery);
                
                // Add VIP Plan (plan)
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rankNum = this.filters.leader.split(' ')[0];
                    params.append('rank', rankNum);
                }

                // Sorting
                params.append('sort_by', this.sort.sortBy || '');
                params.append('sort_dir', this.sort.sortDir || 'desc');

                // Add Date Range
                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    } else if (dates.length === 1) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[0]);
                    }
                } else {
                    params.append('start_date', '');
                    params.append('end_date', '');
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
            } finally {
                this.loading = false;
            }
        },
        async fetchDrilldown(leaderName) {
            this.drilldownLoading = true;
            this.drilldownError = null;
            try {
                const params = new URLSearchParams({
                    leader: leaderName,
                    page: this.drilldownPagination.page,
                    limit: this.drilldownPagination.limit
                });

                if (this.searchQuery) params.append('search', this.searchQuery);

                // Add VIP Plan (plan)
                if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                    params.append('plan', this.filters.vipPlan);
                }

                if (this.filters.leader && this.filters.leader !== 'All') {
                    const rankNum = this.filters.leader.split(' ')[0];
                    params.append('rank', rankNum);
                }

                // Add Date Range
                if (this.filters.dateRange) {
                    const dates = this.filters.dateRange.split(' to ');
                    if (dates.length === 2) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[1]);
                    } else if (dates.length === 1) {
                        params.append('start_date', dates[0]);
                        params.append('end_date', dates[0]);
                    }
                } else {
                    params.append('start_date', '');
                    params.append('end_date', '');
                }

                // Add Detailed Filters
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
                    // credit might be an array if it's from custom-credit checkbox
                    if (Array.isArray(this.activeFilters.credit)) {
                         this.activeFilters.credit.forEach(c => params.append('credit', c));
                    } else {
                         params.append('credit', this.activeFilters.credit);
                    }
                }
                if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
                if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

                // Sorting
                params.append('sort_by', this.drilldownSort.sortBy || '');
                params.append('sort_dir', this.drilldownSort.sortDir || 'desc');

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
                        coinGroup: item.coin_group || '-',
                        mm: item.step_count ,
                        maxCoin: item.max_coin || '-',
                        upper_upline: item.upper_upline || '-',
                        upline: item.upline || '-'
                    }));
                    if (data.pagination) {
                        this.drilldownPagination.totalItems = data.pagination.total || 0;
                        this.drilldownPagination.totalPages = data.pagination.total_pages || 0;
                        this.drilldownPagination.page = data.pagination.current_page || 1;
                    } else {
                        this.drilldownPagination.totalItems = 0;
                        this.drilldownPagination.totalPages = 0;
                        this.drilldownPagination.page = 1;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch trading activity drilldown:', err);
                this.drilldownError = 'Failed to load drilldown data.';
            } finally {
                this.drilldownLoading = false;
            }
        },
        selectLeader(leaderName) {
            this.selectedLeader = leaderName;
            this.searchQuery = ''; // Reset search
            this.activeFilters = {}; // Reset detailed filters
            this.drilldownPagination.page = 1;
            this.fetchDrilldown(leaderName);
        },
        clearSelection() {
            this.selectedLeader = null;
            this.searchQuery = ''; // Reset search
        },
        applyFilters() {
            this.isFilterOpen = false;
            if (this.selectedLeader) {
                this.drilldownPagination.page = 1;
                this.fetchDrilldown(this.selectedLeader);
            } else {
                this.pagination.page = 1;
                this.fetchLeaders();
            }
        },
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
        },
        async exportDrilldown() {
            if (!this.selectedLeader) return;

            const params = new URLSearchParams({
                leader: this.selectedLeader,
                search: this.searchQuery || ''
            });

            // VIP Plan
            if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                params.append('plan', this.filters.vipPlan);
            }

            // Date Range
            if (this.filters.dateRange) {
                const dates = this.filters.dateRange.split(' to ');
                if (dates.length === 2) {
                    params.append('start_date', dates[0]);
                    params.append('end_date', dates[1]);
                } else if (dates.length === 1) {
                    params.append('start_date', dates[0]);
                    params.append('end_date', dates[0]);
                }
            } else {
                params.append('start_date', '');
                params.append('end_date', '');
            }

            // Detailed Filters
            if (this.activeFilters.stable_capital) params.append('stable_capital', this.activeFilters.stable_capital);
            if (this.activeFilters.profit_min) params.append('profit_min', this.activeFilters.profit_min);
            if (this.activeFilters.credit) params.append('credit', this.activeFilters.credit);
            if (this.activeFilters.upline) params.append('upline', this.activeFilters.upline);
            if (this.activeFilters.upper_upline) params.append('upper_upline', this.activeFilters.upper_upline);

            const token = localStorage.getItem('moon_office_token');
            const url = `${BASE_URL}/trading-activity/drilldown/export?${params.toString()}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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
            } catch (error) {
                console.error('Export error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text: 'Gagal mendownload data export. Silakan coba lagi.',
                    confirmButtonColor: '#3085d6'
                });
            }
        },
        exportDrilldownPdf() {
            let listData = this.filteredDrilldownData;
            if (!listData || !listData.length) {
                listData = [
                    { username: 'user_1', paket: 'Basic', noHp: '081234567890', uplineRank3: 'LeaderA', uplineRank1: 'GoldA' },
                    { username: 'user_2', paket: 'Pro+', noHp: '089876543210', uplineRank3: 'LeaderA', uplineRank1: 'GoldB' }
                ];
            }
            const dataToExport = listData.map(item => ({
                Username: item.username || '-',
                Paket: item.vip_level || '-',
                'Active 30D': item.is_active_30d ? 'PASS' : 'FAIL',
                'Profit (ALL TIME)': item.total_profit || '-',
                'Credit (USDT)': item.wallet_usdt || '-',
                'Stable Capital': item.stable_capital_date || '-',
                'NO HP': item.msisdn || '-',
                'Coin Group': item.coin_group || '-',
                MM: item.step_count || '-',
                'Max coin': item.max_coin || '-',
                'UPLINE RANK 6': item.upper_upline || '-',
                'UPLINE RANK 3': item.upline || '-'
            }));
            const leaderText = this.selectedLeader || 'Export';
            JsonToPDF({
                header: ['Username', 'Paket', 'Active 30D', 'Profit (ALL TIME)', 'credit (USDT)', 'stable capital', 'NO HP', 'coin group', 'MM', 'Max coin', 'UPLINE RANK 6', 'UPLINE RANK 3'],
                data: dataToExport,
                filename: `Drilldown_TradingActivity_${leaderText}.pdf`,
                title: `Trading Activity - Drilldown ${leaderText}`
            });
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
                    this.fetchLeaders();
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
                    this.fetchSnapshot();
                    this.fetchLeaders();
                }
            }
        }
    },
    mounted() {
        this.fetchSnapshot();
        this.fetchLeaders();
    },
    template: `
        <MainLayout>
            <!-- Main View -->
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Trading Activity</h1>
                <div class="text-xs text-gray-500 italic">
                    Last Updated: {{ lastUpdated }}
                </div>
            </div>

            <!-- View Content -->
            <div v-if="!selectedLeader">
                <!-- Global Filters -->
                <div class="flex flex-wrap gap-4 mb-8">
                    <!-- Date Range Filter -->
                    <div class="relative">
                        <DatePicker v-model="filters.dateRange" :config="rangePickerConfig">
                            <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5 cursor-pointer">
                                <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">Timeframe:</span>
                                <span class="py-2 pl-2 pr-10 text-sm font-medium min-w-[120px]">{{ filters.dateRange ? filters.dateRange.replace(' to ', ' - ') : 'All Time' }}</span>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </DatePicker>
                    </div>
                    <!-- Leader Rank Filter -->
                     <div class="relative">
                        <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                            <span class="pl-4 py-2 text-gray-500 text-sm whitespace-nowrap">Leader :</span>
                            <select v-model="filters.leader" class="appearance-none bg-transparent py-2 pl-2 pr-10 text-sm font-medium focus:outline-none cursor-pointer min-w-[100px]">
                                <option value="All">All</option>
                                <option v-for="n in 11" :key="n" :value="n + ' ⭐'">{{ n }} ⭐</option>
                                <!-- <option value="Main Leader">Main Leader</option> -->
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
                </div>

                <!-- Stats/Metrics Cards -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-nowrap mb-8 py-2 overflow-x-auto custom-scrollbar">
                    <div v-for="(stat, index) in stats" :key="index" class="flex-1 min-w-[150px] flex flex-col items-center justify-center p-6 text-center border-b md:border-b-0 md:border-r border-gray-100 last:border-r-0 last:border-b-0">
                        <div class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide whitespace-nowrap">{{ stat.label }}</div>
                        <div class="text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">{{ formatStat(stat) }}</div>
                    </div>
                </div>

                <!-- Table Section -->
                <div class="bg-white rounded-t-lg shadow-lg p-6">
                    <!-- Toolbar -->
                    <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6">
                        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto relative">
                            <!-- Search Input -->
                            <div class="w-full md:w-64 h-11">
                                <SearchInput v-model="searchQuery" placeholder="Leader" class="h-full border-gray-100" />
                            </div>
                        </div>
                    </div>
                    </div>

                    <!-- Loading State (Main) -->
                    <div v-if="loading && !selectedLeader" class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                        <p class="text-gray-500 text-sm">Loading trading activity data...</p>
                    </div>

                    <!-- Error State (Main) -->
                    <div v-else-if="error && !selectedLeader" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <span>{{ error }}</span>
                        <button @click="fetchLeaders" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                    </div>

                    <div v-else class="bg-white p-2">
                        <!-- Data Table -->
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
                            <!-- Hide ACTION column -->
                            <template #action-header><th></th></template>

                            <!-- Custom Leader Cell (same style as BotHealth) -->
                            <template #cell-leader="{ value }">
                                <span 
                                    @click="selectLeader(value)"
                                    class="text-[#00A3FF] underline cursor-pointer hover:text-blue-600">
                                    {{ value }}
                                </span>
                            </template>

                            <!-- Empty row-actions to hide action cells -->
                            <template #row-actions></template>
                        </DataTable>
                    </div>
                 </div>
            </div>

            <!-- Drilldown View -->
            <div v-else>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <!-- Drilldown Header -->
                    <div class="flex items-center gap-2 mb-6">
                        <button @click="clearSelection" class="p-1 hover:bg-gray-100 rounded text-teal-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 class="text-xl font-bold text-gray-800">
                            Drilldown Potential Top Up - {{ selectedLeader }}
                        </h2>
                    </div>

                    <!-- Toolbar -->
                    <div class="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
                        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto relative">
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

                            <!-- Search -->
                            <div class="w-full md:w-64 h-11">
                                <SearchInput v-model="searchQuery" placeholder="Search" class="h-full border-gray-200" />
                            </div>
                        </div>
                          <!-- Download Button -->
                          <div class="flex items-center gap-2">
                             <button @click="exportDrilldown" class="text-gray-400 hover:text-gray-600" title="Export CSV">
                                 <img src="./assets/images/icons/download.svg" alt="Download" class="h-6 w-6">
                             </button>
                          </div>
                    </div>

                    <!-- Loading State (Drilldown) -->
                    <div v-if="drilldownLoading" class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39DEBB] mb-4"></div>
                        <p class="text-gray-500 text-sm">Loading drilldown data...</p>
                    </div>

                    <!-- Error State (Drilldown) -->
                    <div v-else-if="drilldownError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <span>{{ drilldownError }}</span>
                        <button @click="fetchDrilldown(selectedLeader)" class="text-xs font-bold uppercase tracking-wider hover:underline">Retry</button>
                    </div>

                    <div v-else>
                        <!-- Data Table -->
                        <DataTable 
                            key="drilldown-table"
                            :columns="drilldownColumns" 
                            :data="filteredDrilldownData"
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
                        <!-- Hide ACTION column -->
                        <template #action-header><th></th></template>
                        <template #row-actions></template>

                         <!-- Custom Active 30D Cell -->
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
                            <span class="font-medium text-gray-900">{{ value }}</span>
                        </template>

                        </DataTable>
                    </div>
                </div>
            </div>
        </MainLayout>
    `
}
