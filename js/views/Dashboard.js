import MainLayout from '../layouts/MainLayout.js?v=24';
import TradingActivity from '../views/TradingActivity.js?v=25';
import { formatNumber } from '../utils/formatters.js';

export default {
    name: 'Dashboard',
    components: {
        MainLayout,
        TradingActivity
    },
    methods: {
        formatNumber
    },
    template: `
        <MainLayout>
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                </div>
                <button class="text-gray-400 hover:text-gray-600">
                   <img src="./assets/images/icons/download.svg" alt="Binance" class="h-6 w-6">
                </button>
            </div>
<!-- Filters -->
             <div class="flex flex-col md:flex-row gap-4 mb-6">
                 <div class="relative">
                     <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Timeframe: <span class="font-medium text-gray-900">All-time</span></span>
                     <select class="appearance-none pl-36 pr-10 py-3 bg-white border border-transparent rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]">
                         <option>All-time</option>
                         <option>This Year</option>
                         <option>This Month</option>
                     </select>
                     <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                         <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                 </div>

                 <div class="relative">
                     <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">VIP Plan: <span class="font-medium text-gray-900">Pro+</span></span>
                     <select class="appearance-none pl-32 pr-10 py-3 bg-white border border-transparent rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]">
                         <option>Pro+</option>
                         <option>Basic</option>
                         <option>Advance</option>
                     </select>
                     <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                         <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                 </div>
            </div>
            <!-- Stats Grid -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <!-- Card 1: Overall Trading Volume -->
                 <div class="flex flex-col justify-center px-4">
                    <div class="text-3xl font-bold text-gray-900">{{ formatNumber(16803000) }}</div>
                    <div class="text-sm text-gray-500 mt-1">Overall Trading Volume</div>
                </div>

                <!-- Card 2: Basic -->
                <div class="flex items-center justify-between px-4 pt-4 md:pt-0">
                    <div>
                        <div class="text-3xl font-bold text-gray-900">{{formatNumber(32)}}%</div>
                        <div class="text-sm text-gray-500 mt-1">Basic</div>
                    </div>
                    <div class="bg-blue-50 p-2 rounded-lg text-blue-600">
                       <img src="./assets/images/icons/users.svg" alt="Binance" class="h-6 w-6">
                    </div>
                </div>

                <!-- Card 3: Advance -->
                <div class="flex items-center justify-between px-4 pt-4 md:pt-0">
                    <div>
                        <div class="text-3xl font-bold text-gray-900">41%</div>
                        <div class="text-sm text-gray-500 mt-1">Advance</div>
                    </div>
                     <div class="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <img src="./assets/images/icons/users.svg" alt="Binance" class="h-6 w-6">
                    </div>
                </div>

                <!-- Card 4: Pro -->
                 <div class="flex items-center justify-between px-4 pt-4 md:pt-0">
                    <div>
                        <div class="text-3xl font-bold text-gray-900">27%</div>
                        <div class="text-sm text-gray-500 mt-1">Pro</div>
                    </div>
                     <div class="bg-blue-50 p-2 rounded-lg text-blue-600">
                         <img src="./assets/images/icons/users.svg" alt="Binance" class="h-6 w-6">
                    </div>
                </div>
            </div>

            

            <!-- Global Stats Table -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-gray-600">
                        <thead>
                            <tr class="border-b border-gray-100">
                                <th class=" sticky top-0 left-0 bg-white z-40 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words">Global</th>
                                <th class="px-6 py-6   w-1/5 font-semibold text-gray-900  ">
                                    <div class="flex  justify-center space-x-2 w-full">
                                        <img src="./assets/images/icons/binance.svg" alt="Binance" class="h-6 w-6">
                                        <span>Binance</span>
                                    </div>
                                </th>
                                <th class="px-6 py-6  w-1/5 font-semibold text-gray-900  ">
                                    <div class="flex  justify-center space-x-2 w-full">
                                      <img src="./assets/images/icons/tko.svg" alt="Tokocrypto" class="h-6 w-6">
                                        <span>Tokocrypto</span>
                                    </div>
                                </th>
                                <th class="px-6 py-6   w-1/5 font-semibold text-gray-900  ">
                                    <div class="flex  justify-center space-x-2 w-full">
                                         <img src="./assets/images/icons/okx.svg" alt="OKX" class="h-6 w-6">
                                        <span>OKX</span>
                                    </div>
                                </th>
                                 <th class="px-6 py-6 font-semibold text-gray-900 w-1/5 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">Active Bots</td>
                                <td class="px-6 py-4 text-center ">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">New activation</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>   
                                <td class="px-6 py-4 text-center">xx</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">Total Trading Volume</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">User Profit (Gross)</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                            </tr>
                             <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">Avg. Profit per Active User (USDT)</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                                <td class="px-6 py-4 text-center">xx</td>
                            </tr>
                             <tr class="hover:bg-gray-50">
                                <td class="sticky left-0 bg-white group-hover:bg-gray-50 z-10 !px-4 md:!px-6 !max-w-[100px] md:!max-w-[200px] !min-w-[100px] md:!min-w-[200px] !w-[100px] md:!w-[200px] break-all break-words text-gray-900">Healthy Users</td>
                                <td class="px-6 py-4 text-center">17,905 <span class="text-gray-400">/ 20,000</span></td>
                                <td class="px-6 py-4 text-center">17,905 <span class="text-gray-400">/ 20,000</span></td>
                                <td class="px-6 py-4 text-center">17,905 <span class="text-gray-400">/ 20,000</span></td>
                                 <td class="px-6 py-4 text-center">17,905 <span class="text-gray-400">/ 20,000</span></td>
                            </tr>
                           
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    `
}

