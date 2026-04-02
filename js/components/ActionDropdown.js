export default {
    name: 'ActionDropdown',
    props: {
        actions: {
            type: Array,
            required: true
            // Format: [{ key: 'edit', label: 'Edit', color: 'gray' }, { key: 'delete', label: 'Delete', color: 'red' }]
        },
        row: {
            type: Object,
            required: true
        }
    },
    emits: ['action'],
    data() {
        return {
            isOpen: false,
            menuStyle: {
                top: '0px',
                right: '0px'
            },
            openUp: false
        }
    },
    methods: {
        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.updatePosition();
                // Close on scroll or resize to prevent menu from detaching
                window.addEventListener('scroll', this.handleScrollResize, { capture: true });
                window.addEventListener('resize', this.handleScrollResize);
            } else {
                this.removeListeners();
            }
        },
        updatePosition() {
            this.$nextTick(() => {
                const btn = this.$refs.triggerBtn;
                if (!btn) return;
                
                const rect = btn.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const windowWidth = window.innerWidth;
                
                // Estimate menu height (~160px for 3 items)
                const estimatedHeight = 160;
                
                if (rect.bottom + estimatedHeight > windowHeight - 20) {
                    this.openUp = true;
                    this.menuStyle = {
                        position: 'fixed',
                        bottom: `${windowHeight - rect.top + 8}px`,
                        right: `${windowWidth - rect.right}px`,
                        zIndex: 10000
                    };
                } else {
                    this.openUp = false;
                    this.menuStyle = {
                        position: 'fixed',
                        top: `${rect.bottom + 8}px`,
                        right: `${windowWidth - rect.right}px`,
                        zIndex: 10000
                    };
                }
            });
        },
        handleScrollResize() {
            this.close();
        },
        removeListeners() {
            window.removeEventListener('scroll', this.handleScrollResize, { capture: true });
            window.removeEventListener('resize', this.handleScrollResize);
        },
        close() {
            if (this.isOpen) {
                this.isOpen = false;
                this.removeListeners();
            }
        },
        handleAction(action) {
            this.$emit('action', { action: action.key, row: this.row });
            this.close();
        },
        getColorClass(color) {
            const colors = {
                gray: 'text-gray-700',
                red: 'text-red-600',
                yellow: 'text-yellow-600',
                green: 'text-green-600',
                blue: 'text-blue-600'
            };
            return colors[color] || colors.gray;
        },
        handleClickOutside(e) {
            if (this.isOpen && !this.$el.contains(e.target)) {
                // Also check if click is inside the teleported menu
                const menu = document.querySelector('.teleported-action-menu');
                if (menu && menu.contains(e.target)) return;
                
                this.close();
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
        this.removeListeners();
    },
    template: `
        <div class="action-dropdown inline-block relative">
            <button 
                ref="triggerBtn"
                @click.stop="toggle"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </button>
            
            <!-- Dropdown Menu Teleported to Body -->
            <teleport to="body">
                <transition name="fade">
                    <div 
                        v-if="isOpen"
                        class="teleported-action-menu w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 py-2 transform transition-all duration-200 origin-top-right"
                        :style="menuStyle"
                    >
                        <div class="px-3 py-1 mb-1 border-b border-gray-50">
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Options</span>
                        </div>
                        <button 
                            v-for="action in actions"
                            :key="action.key"
                            @click="handleAction(action)"
                            :class="['w-full px-4 py-2.5 text-left text-sm hover:bg-teal-50 hover:text-teal-700 transition-all flex items-center gap-2 group', getColorClass(action.color)]"
                        >
                            <span class="w-1.5 h-1.5 rounded-full bg-current opacity-40 group-hover:opacity-100 transition-opacity"></span>
                            {{ action.label }}
                        </button>
                    </div>
                </transition>
            </teleport>
        </div>
    `
}
