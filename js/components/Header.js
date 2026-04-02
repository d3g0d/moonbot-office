export default {
    name: 'Header',
    template: `
        <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
            <button @click="$emit('toggle-sidebar')" class="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500">
                <span class="sr-only">Open sidebar</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            
            <div class="flex-1 flex justify-end">
                <div class="flex items-center gap-4">
                    <button class="p-2 rounded-full text-gray-400 hover:text-gray-500">
                        <span class="sr-only">View notifications</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>

                    <!-- Profile Dropdown -->
                    <div class="relative ml-3">
                        <div class="flex items-center gap-3">
                            <div class="text-right hidden sm:block">
                                <div class="text-sm font-medium text-gray-900">Admin User</div>
                                <div class="text-xs text-gray-500">admin@moonbot.io</div>
                            </div>
                            <img class="h-8 w-8 rounded-full bg-gray-300" src="https://ui-avatars.com/api/?name=Admin+User&background=0ea5e9&color=fff" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `
}
