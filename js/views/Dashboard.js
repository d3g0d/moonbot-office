import MainLayout from '../layouts/MainLayout.js?v=24';
import { formatNumber } from '../utils/formatters.js';
import { fetchApi } from '../utils/api.js?v=4';

export default {
    name: 'Dashboard',
    components: {
        MainLayout
    },
    data() {
        return {
            loading: false,
            error: null,
            filters: {
                timeframe: 'all-time',
                plan: ''
            },
            stats: {
                global: {},
                by_exchanger: {},
                segment_contribution: {
                    basic: { pct: 0 },
                    advance: { pct: 0 },
                    pro: { pct: 0 }
                }
            },
            lastUpdated: 'Live Stats'
        }
    },
    mounted() {
        this.fetchStats();
    },
    watch: {
        filters: {
            handler() {
                this.fetchStats();
            },
            deep: true
        }
    },
    methods: {
        formatNumber,
        formatExchangerName(key) {
            const mapping = {
                'tko': 'Tokocrypto',
                'okx': 'OKX',
                'binance': 'Binance'
            };
            return mapping[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
        },
        async fetchStats() {
            this.loading = true;
            this.error = null;
            try {
                const params = new URLSearchParams();
                
                // Map timeframe to start_date/end_date logic if needed
                // For now, following the simple select options
                if (this.filters.timeframe === 'this-year') {
                    params.append('start_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
                } else if (this.filters.timeframe === 'this-month') {
                    params.append('start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
                }

                if (this.filters.plan) {
                    params.append('plan', this.filters.plan);
                }

                const response = await fetchApi(`/dashboard?${params.toString()}`);
                if (response.success && response.data) {
                    this.stats = response.data;
                    if (response.data.stat_date) {
                        const date = new Date(response.data.stat_date);
                        this.lastUpdated = `Stats as of ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                this.error = 'Failed to load dashboard statistics.';
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-base font-bold text-gray-900 uppercase tracking-tight">Dashboard Overview</h1>
                    <p class="text-xs text-gray-500 mt-1">{{ lastUpdated }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="fetchStats" class="text-xs font-medium text-[#00A3FF] hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                        Refresh Data
                    </button>
                    <button class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all">
                       <img src="./assets/images/icons/download.svg" alt="Download" class="h-5 w-5">
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-4 mb-8">
                <!-- Timeframe Filter -->
                <div class="relative">
                    <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                        <span class="pl-4 py-2 text-gray-500 text-xs whitespace-nowrap">Timeframe:</span>
                        <select v-model="filters.timeframe" class="appearance-none bg-transparent py-2 pl-2 pr-10 text-xs font-medium focus:outline-none cursor-pointer min-w-[120px]">
                            <option value="all-time">All-time</option>
                            <option value="this-year">This Year</option>
                            <option value="this-month">This Month</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <!-- VIP Plan Filter -->
                <div class="relative">
                    <div class="flex items-center bg-white border border-gray-100 text-gray-700 rounded-full shadow-sm overflow-hidden px-1 py-0.5">
                        <span class="pl-4 py-2 text-gray-500 text-xs whitespace-nowrap">VIP Plan:</span>
                        <select v-model="filters.plan" class="appearance-none bg-transparent py-2 pl-2 pr-10 text-xs font-medium focus:outline-none cursor-pointer min-w-[120px]">
                            <option value="">All Plans</option>
                            <option value="1">B+</option>
                            <option value="2">A+</option>
                            <option value="3">P+</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="bg-white rounded-xl shadow-sm p-3 mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <!-- Overall Trading Volume -->
                 <div class="flex flex-col justify-center px-4 py-1">
                    <div class="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Overall Volume</div>
                    <div class="text-lg font-bold text-gray-900">
                        <span class="text-xs font-normal text-gray-400 mr-1">$</span>{{ formatNumber(stats.global?.total_trading_volume || 0) }}
                    </div>
                </div>

                <!-- Basic -->
                <div class="flex items-center justify-between px-4 py-1 pt-3 md:pt-0">
                    <div>
                        <div class="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Basic Contribution</div>
                        <div class="text-lg font-bold text-gray-900">{{ stats.segment_contribution?.basic?.pct || 0 }}%</div>
                    </div>
                    <div class="bg-blue-50/50 p-1.5 rounded-lg">
                       <img src="./assets/images/icons/users.svg" alt="Basic" class="h-4 w-4 opacity-70">
                    </div>
                </div>

                <!-- Advance -->
                <div class="flex items-center justify-between px-4 py-1 pt-3 md:pt-0">
                    <div>
                        <div class="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Advance Contribution</div>
                        <div class="text-lg font-bold text-gray-900">{{ stats.segment_contribution?.advance?.pct || 0 }}%</div>
                    </div>
                     <div class="bg-blue-50/50 p-1.5 rounded-lg">
                        <img src="./assets/images/icons/users.svg" alt="Advance" class="h-4 w-4 opacity-70">
                    </div>
                </div>

                <!-- Pro -->
                 <div class="flex items-center justify-between px-4 py-1 pt-3 md:pt-0">
                    <div>
                        <div class="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Pro Contribution</div>
                        <div class="text-lg font-bold text-gray-900">{{ stats.segment_contribution?.pro?.pct || 0 }}%</div>
                    </div>
                     <div class="bg-blue-50/50 p-1.5 rounded-lg">
                          <img src="./assets/images/icons/users.svg" alt="Pro" class="h-4 w-4 opacity-70">
                    </div>
                </div>
            </div>

            <!-- Comparison Table -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                    <h3 class="text-xs font-bold text-gray-900 uppercase tracking-widest">Exchanger Performance Comparison</h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-gray-100 bg-white">
                                <th class="sticky left-0 bg-white z-10 px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-50 min-w-[200px]">Metrics</th>
                                <th v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-3 text-xs font-bold text-gray-900 text-center border-r border-gray-50 min-w-[150px]">
                                    <div class="flex items-center justify-center gap-2">
                                        <img :src="'./assets/images/icons/' + key + '.svg'" :alt="key" class="h-5 w-5" v-if="key !== 'total'">
                                        <span>{{ formatExchangerName(key) }}</span>
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-xs font-bold text-gray-900 text-center bg-blue-50/30 min-w-[150px]">Total (Global)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 text-xs text-gray-600">
                            <!-- Active Bots -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">Active Bots</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">
                                    {{ formatNumber(ex.active_bots) }} <span class="text-[10px] text-gray-400 font-normal ml-1">({{ ex.active_bots_pct }}%)</span>
                                </td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">
                                    {{ formatNumber(stats.global?.active_bots || 0) }} <span class="text-[10px] text-gray-400 font-normal ml-1">({{ stats.global?.active_bots_pct || 0 }}%)</span>
                                </td>
                            </tr>
                            <!-- New Activation -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">New Activation</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">{{ formatNumber(ex.new_activation) }}</td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">{{ formatNumber(stats.global?.new_activation || 0) }}</td>
                            </tr>
                            <!-- Trading Volume -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">Trading Volume ($)</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">{{ formatNumber(ex.total_trading_volume) }}</td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">{{ formatNumber(stats.global?.total_trading_volume || 0) }}</td>
                            </tr>
                            <!-- User Profit -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">User Profit Gross ($)</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">{{ formatNumber(ex.user_profit_gross) }}</td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">{{ formatNumber(stats.global?.user_profit_gross || 0) }}</td>
                            </tr>
                            <!-- Avg Profit -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">Avg Profit/Active ($)</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">{{ formatNumber(ex.avg_profit_per_active_user) }}</td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">{{ formatNumber(stats.global?.avg_profit_per_active_user || 0) }}</td>
                            </tr>
                            <!-- Healthy Users -->
                            <tr class="hover:bg-gray-50/50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">Healthy Users</td>
                                <td v-for="(ex, key) in stats.by_exchanger" :key="key" class="px-4 py-2.5 text-center border-r border-gray-50">
                                    <div v-if="ex.health">
                                        {{ formatNumber(ex.health.healthy_users) }}<span class="text-[10px] text-gray-400 mx-1">/</span>{{ formatNumber(ex.health.total_eligible) }}
                                        <div class="mt-1 text-[10px] font-bold" :class="ex.health.health_index > 0.7 ? 'text-green-500' : 'text-orange-500'">
                                            Index: {{ ex.health.health_index || '-' }}
                                        </div>
                                    </div>
                                    <span v-else>-</span>
                                </td>
                                <td class="px-4 py-2.5 text-center bg-blue-50/10 font-bold text-gray-900">
                                    <div v-if="stats.global?.health">
                                        {{ formatNumber(stats.global.health.healthy_users) }}<span class="text-[10px] text-gray-400 mx-1">/</span>{{ formatNumber(stats.global.health.total_eligible) }}
                                        <div class="mt-1 text-[10px]" :class="stats.global.health.health_index > 0.7 ? 'text-green-500' : 'text-orange-500'">
                                            Index: {{ stats.global.health.health_index }}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    `
}

