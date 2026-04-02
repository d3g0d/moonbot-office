import Navigation from '../components/Navigation.js?v=25';
// import Header from '../components/Header.js';

export default {
    name: 'MainLayout',
    components: {
        Navigation,
        // Header
    },
    data() {
        return {
            sidebarOpen: false
        }
    },
    template: `
        <div class="flex h-screen bg-gray-50 overflow-hidden">
            <!-- Mobile Sidebar Overlay -->
            <div v-show="sidebarOpen" @click="sidebarOpen = false" 
                class="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden transition-opacity"
                aria-hidden="true">
            </div>

            <!-- Navigation Sidebar -->
            <!-- Mobile: Fixed, slide in/out. Desktop: Static, always visible. -->
            <Navigation 
                @close="sidebarOpen = false"
                :class="[
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full', 
                    'md:translate-x-0',
                    'fixed md:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out'
                ]"
            />
            
            <div class="flex-1 flex flex-col w-0 overflow-hidden">
               <!--   <Header @toggle-sidebar="sidebarOpen = !sidebarOpen" /> -->
                
                <!-- Mobile Header (Visible only on mobile) -->
                <div class="md:hidden fixed top-0 w-full h-16 bg-sidebar-gradient   z-30 flex items-center justify-between px-6 shadow-md">
                    <!-- Logo Left -->
                    <img src="./assets/images/logo/logo.svg" class="h-8 w-auto" alt="Moonbot">
                    
                    <!-- Burger Button Right -->
                    <button 
                        v-show="!sidebarOpen"
                        @click="sidebarOpen = true"
                        class="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none transition-colors duration-200"
                        aria-label="Open sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <!-- Close button shown when sidebar open (placeholder to maintain spacing if needed, but sidebar covers this) -->
                    <div v-show="sidebarOpen" class="w-10"></div>
                </div>

                <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-8 pt-16 md:pt-8">
                    <slot></slot>
                </main>
            </div>
        </div>
    `
}
