import { fetchApi } from '../utils/api.js?v=7';
import { formatRank } from '../utils/formatters.js';

export default {
    name: 'Navigation',
    data() {
        let initialFeatures = [];
        let hasCached = false;
        try {
            const cached = localStorage.getItem('moon_office_permissions');
            if (cached) {
                initialFeatures = JSON.parse(cached);
                hasCached = true;
            }
        } catch (e) {
            console.error('Failed to parse cached permissions', e);
        }

        return {
            allowedFeatures: initialFeatures,
            isLoadingPermissions: !hasCached,
            username: localStorage.getItem('moon_office_username') || 'User',
            roleName: localStorage.getItem('moon_office_role') || 'User',
            searchQuery: 'Dashboards',
            expanded: {
                'Activation Pipeline': false,
                'Trading Activity': false,
               
                'Bot Health': false,
                 
                'Tools': false
            },
            menuGroups: [
                {
                    items: [
                         {
                            id: 'activation-pipeline',
                            label: 'Activation Pipeline',
                            iconFile: 'activation_pipline.svg',
                            featureName: 'activation_pipeline',
                            children: [
                                { label: 'Pipeline', path: '/pipeline' },
                                { label: 'Change Tracker', path: '/change-tracker' }
                            ]
                        },
                        {
                            id: 'trading-activity',
                            label: 'Trading Activity',
                            iconFile: 'trading_activity.svg',
                            path: '/trading-activity',
                            featureName: 'trading_activity'
                        },
                        {
                            id: 'bot-health',
                            label: 'Bot Health',
                            iconFile: 'bot_health.svg',
                            path: '/bot-health',
                            featureName: 'bot_health'
                        },
                       

                        
                    ]
                },
                // {
                //     title: 'Tools',
                //     id: 'tools-section',
                //     items: [
                //         {
                //             id: 'placeholder1',
                //             label: 'Placeholder1',
                //             icon: 'chat-bubble-left-ellipsis',
                //             children: [{ label: 'Sub Item', path: '#' }]
                //         },
                //         {
                //             id: 'placeholder2',
                //             label: 'Placeholder2',
                //             icon: 'calendar',
                //             children: [{ label: 'Sub Item', path: '#' }]
                //         },
                //         {
                //             id: 'placeholder3',
                //             label: 'Placeholder3',
                //             icon: 'folder',
                //             children: [{ label: 'Sub Item', path: '#' }]
                //         },
                //         {
                //             id: 'placeholder4',
                //             label: 'Placeholder4',
                //             icon: 'document',
                //             children: [{ label: 'Sub Item', path: '#' }]
                //         }
                //     ]
                // },
                {
                    title: 'Manage',
                    id: 'manage-section',
                    items: [
                        {
                            id: 'access-management',
                            label: 'Access Management',
                            iconFile: 'access_management.svg',
                            path: '/access-management',
                            featureName: 'role_management'
                        }
                    ]
                }
            ]
        }
    },
    computed: {
        filteredMenuGroups() {
            if (this.isLoadingPermissions) return [];
            return this.menuGroups.map(group => {
                const filteredItems = group.items.filter(item => {
                    return !item.featureName || this.allowedFeatures.includes(item.featureName);
                });
                return { ...group, items: filteredItems };
            }).filter(group => group.items.length > 0);
        }
    },
    methods: {
        formatRank,
        async fetchPermissions() {
            try {
                this.isLoadingPermissions = true;
                const response = await fetchApi('/me/permissions');
                if (response.success && response.data && response.data.features) {
                    this.allowedFeatures = response.data.features.map(f => f.name);
                }
            } catch (err) {
                console.error('Failed to fetch permissions:', err);
                // Fallback in case of error? (Assume all blocked or local bypass)
            } finally {
                this.isLoadingPermissions = false;
            }
        },
        toggle(item) {
            if (item.children) {
                this.expanded[item.label] = !this.expanded[item.label];
            }
        },
        isOpen(item) {
            return !!this.expanded[item.label];
        },
        // Helper to render icons
        getIcon(name) {
            // Using Heroicons paths (outline)
            const icons = {
                'shield-check': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                'currency-dollar': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                'share': 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
                'chat-bubble-left-ellipsis': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                'folder': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
                'document': 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
                'user-group': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                'squares-2x2': 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
                'chevron-down': 'M19 9l-7 7-7-7'
            };
            return icons[name] || '';
        },
        async logout() {
            try {
                // Hit the server logout endpoint
                await fetchApi('/logout', { method: 'POST' });
            } catch (err) {
                console.error('Logout failed:', err);
            } finally {
                // Remove tokens from localStorage
                localStorage.removeItem('moon_office_token');
                localStorage.removeItem('moon_office_permissions');
                localStorage.removeItem('moon_office_username');
                localStorage.removeItem('moon_office_role');
            
            // Clear temporary OTP tokens
            sessionStorage.removeItem('moon_office_temp_token');
            
            // Clear cookies (specifically the token if any)
            document.cookie = "moon_office_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
                // Redirect using router
                this.$router.push('/login');
            }
        }
    },
    mounted() {
        this.fetchPermissions();
        this.username = localStorage.getItem('moon_office_username') || 'User';
        this.roleName = localStorage.getItem('moon_office_role') || 'User';
    },
    template: `
        <aside class="w-64 bg-sidebar-gradient    min-h-screen flex flex-col font-sans">
            <!-- Header -->
            <div class="h-16 flex items-center px-6 mb-4 relative">
                <div class="flex items-center gap-2 font-bold text-xl text-white tracking-wide">
                    <!-- Logo (Using SVG placeholder or img if available) -->
                   
                    <img src="./assets/images/logo/logo.svg" class="h-8 w-auto" alt="Moonbot">
             
                </div>
                
                <!-- Mobile Close Button -->
                <button 
                    @click="$emit('close')"
                    class="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors focus:outline-none"
                    aria-label="Close sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

             <!-- Dashboard Link -->
             <div class="px-4 mb-6" v-if="!isLoadingPermissions && allowedFeatures.includes('main_dashboard')">
                <router-link to="/" 
                    class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors text-white"
                    :class="$route.path === '/' ? 'bg-white/10' : 'hover:bg-white/5'"
                >
                     <img src="./assets/images/icons/dashboard.svg" 
                        class="h-5 w-5 brightness-0 invert transition-all" 
                        alt="Dashboard">
                    <span>Dashboards</span>
                </router-link>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6">
                
                <div v-for="(group, index) in filteredMenuGroups" :key="index">
                    <h3 v-if="group.title" class="px-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                        {{ group.title }}
                    </h3>
                    
                    <ul class="space-y-1">
                        <li v-for="item in group.items" :key="item.id">
                            <!-- Router Link for items without children -->
                            <router-link 
                                v-if="!item.children && item.path && item.path !== '#'" 
                                :to="item.path"
                                class="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors text-white"
                                :class="$route.path === item.path ? 'bg-white/10' : 'hover:bg-white/5'"
                            >
                                <div class="flex items-center gap-3">
                                    <img v-if="item.iconFile" :src="'./assets/images/icons/' + item.iconFile" class="h-5 w-5" :alt="item.label">
                                    <span>{{ item.label }}</span>
                                </div>
                            </router-link>
                            
                            <!-- Toggle for items with children OR placeholder links -->
                            <div 
                                v-else
                                @click="toggle(item)" 
                                class="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors text-white hover:bg-white/5"
                            >
                                <div class="flex items-center gap-3">
                                    <!-- Icon -->
                                    <img v-if="item.iconFile" :src="'./assets/images/icons/' + item.iconFile" class="h-5 w-5" :alt="item.label">
                                    
                                    <span>{{ item.label }}</span>
                                </div>

                                <!-- Chevron for children -->
                                <svg v-if="item.children" xmlns="http://www.w3.org/2000/svg" 
                                    class="h-4 w-4 transition-transform duration-200" 
                                    :class="{'rotate-180': isOpen(item)}"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            <!-- Children -->
                            <ul v-if="item.children" v-show="isOpen(item)" class="space-y-1 pl-10 mt-1 transition-all">
                                <li v-for="child in item.children" :key="child.label">
                                    <router-link :to="child.path" v-if="child.path !== '#'" class="block px-2 py-1.5 text-sm rounded-md text-white hover:bg-white/5 transition-colors">
                                        {{ child.label }}
                                    </router-link>
                                    <a v-else href="#" @click.prevent class="block px-2 py-1.5 text-sm rounded-md text-white hover:bg-white/5 transition-colors">
                                        {{ child.label }}
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>

            </nav>

            <!-- Footer / User Profile -->
            <div class="p-4 border-t border-white/10">
                <div class="flex items-center justify-between px-2">
                    <div class="flex-1 min-w-0">
                         <p class="text-sm font-medium text-white truncate" :title="username">
                            {{ username }}
                        </p>
                        <p class="text-xs text-white/70 truncate" :title="roleName">
                            {{ roleName }}
                        </p>
                    </div>
                    
                    <!-- Logout Button -->
                    <button @click="logout" class="p-2 rounded-lg text-[#ff4948] hover:text-white hover:bg-white/10 transition-colors" title="Logout">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    `
}
