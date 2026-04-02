export default {
    name: 'FilterDropdown',
    props: {
        isOpen: {
            type: Boolean,
            required: true
        },
        schema: {
            type: Array,
            required: true,
            // Example schema:
            // [
            //   {
            //     type: 'checkbox-group',
            //     label: 'VIP Plan',
            //     key: 'vipPlan',
            //     options: [
            //       { label: 'Basic', value: 'Basic' },
            //       { label: 'Advance', value: 'Advance' }
            //     ],
            //     layout: 'row' // or 'col'
            //   },
            //   {
            //     type: 'input-range',
            //     label: 'Profit (All Time)',
            //     key: 'profit',
            //     prefix: '$',
            //     placeholder: '00.00'
            //   }
            // ]
            // ]
        },
        value: { // Vue 2 v-model prop
            type: Object,
            default: () => ({})
        },
        modelValue: { // Vue 3 v-model prop
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            localFilters: {}
        }
    },
    computed: {
        model() {
            return this.modelValue && Object.keys(this.modelValue).length > 0 ? this.modelValue : this.value;
        }
    },
    watch: {
        model: {
            handler(newVal) {
                this.localFilters = JSON.parse(JSON.stringify(newVal || {}));
            },
            deep: true
        },
        isOpen: {
            handler(newVal) {
                console.log('FilterDropdown watcher fired. New isOpen:', newVal);
                if (newVal) {
                    // Clone the value when opening
                    this.localFilters = JSON.parse(JSON.stringify(this.model || {}));

                    // Safety check for schema
                    if (this.schema) {
                        // Ensure all schema keys exist
                        this.schema.forEach(field => {
                            if (this.localFilters[field.key] === undefined) {
                                if (field.type === 'checkbox-group') {
                                    this.$set ? this.$set(this.localFilters, field.key, []) : (this.localFilters[field.key] = []);
                                } else {
                                    this.$set ? this.$set(this.localFilters, field.key, null) : (this.localFilters[field.key] = null);
                                }
                            }
                        });
                    }
                }
            },
            immediate: true
        }
    },
    methods: {
        applyFilters() {
            const result = { ...this.localFilters };
            this.$emit('input', result);            // Vue 2
            this.$emit('update:modelValue', result); // Vue 3
            this.$emit('apply');
            this.$emit('close');
        },
        resetFilters() {
            this.localFilters = {};
            if (this.schema) {
                this.schema.forEach(field => {
                    if (field.type === 'checkbox-group') {
                        this.$set ? this.$set(this.localFilters, field.key, []) : (this.localFilters[field.key] = []);
                    } else {
                        this.$set ? this.$set(this.localFilters, field.key, null) : (this.localFilters[field.key] = null);
                    }
                });
            }
        },
        cancel() {
            this.$emit('close');
        }
    },
    mounted() {
        console.log('FilterDropdown v3 mounted');
        console.log('Schema:', this.schema);
        console.log('Initial Value:', this.value);
        // Click outside listener
        document.addEventListener('click', (e) => {
            if (this.isOpen && this.$el && !this.$el.contains(e.target) && !e.target.closest('.filter-trigger')) {
                this.$emit('close');
            }
        });
    },
    template: `
        <div v-show="isOpen" class="absolute top-full left-0 mt-2 w-[85vw] sm:w-[400px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100">
                <h3 class="text-lg font-bold text-gray-900">Filter</h3>
            </div>

            <!-- Body -->
            <div class="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                <div v-for="(field, index) in schema" :key="index" class="space-y-2">
                    <label class="block text-sm font-medium text-gray-900">{{ field.label }}</label>

                    <!-- Checkbox Group -->
                    <div v-if="field.type === 'checkbox-group'" class="flex flex-wrap gap-x-8 gap-y-3">
                        <label v-for="option in field.options" :key="option.value" class="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                :value="option.value" 
                                v-model="localFilters[field.key]"
                                class="w-5 h-5 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                            >
                            <span class="text-gray-600 text-sm">{{ option.label }}</span>
                        </label>
                    </div>

                    <!-- Radio Group -->
                    <div v-if="field.type === 'radio-group'" class="flex flex-wrap gap-x-8 gap-y-3">
                        <label v-for="option in field.options" :key="option.value" class="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                :name="field.key"
                                :value="option.value" 
                                v-model="localFilters[field.key]"
                                class="w-5 h-5 text-teal-500 border-gray-300 focus:ring-teal-500"
                            >
                            <span class="text-gray-600 text-sm">{{ option.label }}</span>
                        </label>
                    </div>

                    <!-- Input Range / Comparison -->
                    <div v-if="field.type === 'input-range'" class="flex items-center space-x-2">
                         <div class="relative w-full">
                            <span v-if="field.prefix" class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                {{ field.prefix }}
                            </span>
                             <span v-else class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                &gt;
                            </span>
                            <input 
                                type="text" 
                                v-model="localFilters[field.key]"
                                :placeholder="field.placeholder"
                                :class="['w-full border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700', field.prefix ? 'pl-7' : 'pl-8']"
                            >
                        </div>
                    </div>
                    
                    <!-- Text Input -->
                    <div v-if="field.type === 'text'" class="relative">
                         <input 
                            type="text" 
                            v-model="localFilters[field.key]"
                            :placeholder="field.placeholder"
                            class="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                        >
                    </div>

                    <!-- Radio Group (Custom for Credit example) -->
                     <div v-if="field.type === 'custom-credit'" class="flex flex-wrap gap-x-12 gap-y-3">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                value=">3$" 
                                v-model="localFilters[field.key]"
                                class="w-5 h-5 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                            >
                            <span class="text-gray-600 text-sm">>3$</span>
                        </label>
                         <label class="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                value="<=3$" 
                                v-model="localFilters[field.key]"
                                class="w-5 h-5 rounded border-gray-300 focus:ring-teal-500"
                            >
                            <span class="text-gray-600 text-sm">&le;3$</span>
                        </label>
                    </div>

                     <!-- Date/Days Range -->
                    <div v-if="field.type === 'days-input'" class="relative w-32 border border-gray-100 rounded-lg py-2 pl-3 pr-12">
                         <input 
                            type="text" 
                            v-model="localFilters[field.key]"
                            :placeholder="field.placeholder"
                            class="w-full  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                        >
                        <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm pointer-events-none">Days</span>
                    </div>

                    <!-- Date Input -->
                    <div v-if="field.type === 'date'" class="relative">
                        <input 
                            type="date" 
                            v-model="localFilters[field.key]"
                            class="w-full border border-gray-100 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700 bg-gray-50"
                        >
                    </div>

                 </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
                <button 
                    @click="resetFilters"
                    class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none"
                >
                    Reset
                </button>
                <button 
                    @click="applyFilters"
                    class="px-6 py-2 bg-[#39DEBB] text-white rounded-lg font-medium hover:bg-[#2dc4a4] focus:outline-none shadow-sm"
                >
                    Apply
                </button>
            </div>
        </div>
    `
}
