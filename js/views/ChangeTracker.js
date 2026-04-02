import MainLayout from '../layouts/MainLayout.js?v=24';
import DataTable from '../components/DataTable.js?v=11';
import SearchInput from '../components/SearchInput.js';

export default {
    name: 'ChangeTracker',
    components: {
        MainLayout,
        DataTable,
        SearchInput
    },
    data() {
        return {
            filters: {
                month: 'Oct 2026',
                leader: '6 ⭐',
                vipPlan: 'All'
            },
            searchQuery: '',
            internalSearchQuery: '',
            columns: [
                
                { 
                    key: 'leader', 
                    label: 'LEADER', 
                    sortable: true,
                    thClass: 'sticky top-0 left-10 md:left-16 bg-white z-40  whitespace-nowrap !px-2 md:!px-6 min-w-[140px]',
                    class: 'sticky left-10 md:left-16 bg-white group-hover:bg-gray-50 z-10   whitespace-nowrap !px-2 md:!px-6 min-w-[140px]'
                },
                { key: 'vipPlan', label: 'VIP PLAN', sortable: true, align: 'center' },
                { key: 'time', label: 'TIME', sortable: true, align: 'center' },
                { key: 'conversion', label: 'CONVERSION BOT RUN (OKT)', sortable: true, align: 'center' },
                { key: 'nov', label: '+NOV', sortable: true, align: 'center' },
                { key: 'des', label: '+DES', sortable: true, align: 'center' },
                { key: 'cumulative', label: 'CUMULATIVE', sortable: true, align: 'center' },
                { key: 'totalJoin', label: 'TOTAL JOIN', sortable: true, align: 'center' }
            ],
            trackerData: [
                { id: 1, leader: 'Moonbot_LeaderD12', vipPlan: 'Advance', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 2, leader: 'RizkyFlow', vipPlan: 'Advance', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 3, leader: 'luna_77', vipPlan: 'Basic', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 4, leader: 'SultanMoon', vipPlan: 'Pro+', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 5, leader: 'FajarNova', vipPlan: 'Pro+', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 6, leader: 'AstroCuan', vipPlan: 'Pro+', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 7, leader: 'CandleHunter', vipPlan: 'Basic', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 8, leader: 'CryptoSenja+', vipPlan: 'Pro+', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'xx.x %', totalJoin: 'xxxx' },
                { id: 9, leader: 'MoonTrader88', vipPlan: 'Advance', time: 'Okt', conversion: 'xx.x %', nov: 'xx.x %', des: 'xx.x %', cumulative: 'v %', totalJoin: 'xxxx' }
            ]
        }
    },
    computed: {
        filteredData() {
            let data = this.trackerData;
            
            // Global search
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                data = data.filter(item =>
                    item.leader.toLowerCase().includes(query) ||
                    item.vipPlan.toLowerCase().includes(query)
                );
            }

            // Internal table search
            if (this.internalSearchQuery) {
                const query = this.internalSearchQuery.toLowerCase();
                data = data.filter(item =>
                    item.leader.toLowerCase().includes(query)
                );
            }
            
            if (this.filters.vipPlan && this.filters.vipPlan !== 'All') {
                data = data.filter(item => item.vipPlan === this.filters.vipPlan);
            }
            return data;
        }
    },
    template: `
        <MainLayout>
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Change Tracker</h1>
            </div>

            <!-- Filters Area -->
            <div class="flex flex-wrap items-center gap-4 mb-8">
                <!-- Month Filter -->
                <div class="relative">
                    <div class="flex items-center bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm overflow-hidden px-4 py-2">
                        <span class="text-gray-500 mr-2">Month:</span>
                        <select v-model="filters.month" class="appearance-none bg-transparent focus:outline-none cursor-pointer pr-6 font-medium">
                            <option>Oct 2026</option>
                            <option>Nov 2026</option>
                            <option>Dec 2026</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                             <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Leader Filter -->
                <div class="relative">
                    <div class="flex items-center bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm overflow-hidden px-4 py-2">
                        <span class="text-gray-500 mr-2">Leader :</span>
                        <select v-model="filters.leader" class="appearance-none bg-transparent focus:outline-none cursor-pointer pr-6 font-medium">
                            <option>6 ⭐</option>
                            <option>Main Leader</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                             
                             <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                 <!-- VIP Plan Filter -->
                 <div class="relative">
                    <div class="flex items-center bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm overflow-hidden px-4 py-2">
                        <span class="text-gray-500 mr-2">VIP Plan :</span>
                        <select v-model="filters.vipPlan" class="appearance-none bg-transparent focus:outline-none cursor-pointer pr-6 font-medium">
                            <option>All</option>
                            <option>Basic</option>
                            <option>Advance</option>
                            <option>Pro+</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                             <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Global Search -->
                <div class="relative bg-white border border-gray-200 rounded-full shadow-sm flex items-center px-4 py-2 w-64 ml-4">
                    <input type="text" v-model="searchQuery" placeholder="Search" class="appearance-none bg-transparent focus:outline-none w-full text-gray-700" />
                    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <!-- Table Card -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Data Table Toolbar (Internal Search) -->
                <div class="flex flex-wrap md:flex-nowrap justify-start items-center mb-6">
                    <div class="w-full md:w-64 h-11 relative">
                        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            v-model="internalSearchQuery" 
                            placeholder="Search" 
                            class="w-full h-full pl-9 pr-4 text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" 
                        />
                    </div>
                </div>

                <div class="bg-white">
                    <DataTable 
                        :columns="columns" 
                        :data="filteredData"
                        :defaultRowsPerPage="25"
                        :rowsPerPageOptions="[10, 25, 50]"
                        :stickyIndex="true"
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
                            <span class="text-gray-900 font-medium">
                                {{ value }}
                            </span>
                        </template>
                        
                        <!-- VIP Plan styling to match Pipeline -->
                        <template #cell-vipPlan="{ value }">
                            <span class="text-gray-900 font-medium">{{ value }}</span>
                        </template>
                        
                        <!-- Value styling -->
                        <template #cell-conversion="{ value }">
                            <span class="text-gray-900 font-medium">{{ value }}</span>
                        </template>
                    </DataTable>
                    
                    <div class="flex justify-end mt-2 text-xs text-gray-500">
                        Last Updated: 12/13/2026 08:00 PM (GMT+7)
                    </div>
                </div>
            </div>
        </MainLayout>
    `
}
