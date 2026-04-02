export default {
    name: 'DatePicker',
    props: {
        modelValue: {
            type: [String, Array, Date],
            default: null
        },
        config: {
            type: Object,
            default: () => ({})
        },
        placeholder: {
            type: String,
            default: 'Select Date'
        }
    },
    emits: ['update:modelValue', 'change'],
    data() {
        return {
            fp: null
        }
    },
    mounted() {
        this.initFlatpickr();
    },
    beforeUnmount() {
        if (this.fp) {
            this.fp.destroy();
        }
    },
    methods: {
        initFlatpickr() {
            const self = this;
            const defaultConfig = {
                dateFormat: "Y-m-d",
                disableMobile: "true",
                onChange: (selectedDates, dateStr, instance) => {
                    self.$emit('update:modelValue', dateStr);
                    self.$emit('change', selectedDates, dateStr);
                }
            };

            const config = { ...defaultConfig, ...this.config };

            // If modelValue exists, set it as defaultDate
            if (this.modelValue) {
                config.defaultDate = this.modelValue;
            }

            this.fp = flatpickr(this.$refs.dateInput, config);
        },
        open() {
            if (this.fp) {
                this.fp.open();
            }
        }
    },
    watch: {
        modelValue(newValue) {
            if (this.fp && newValue !== this.fp.input.value) {
                this.fp.setDate(newValue, false); // false = don't trigger onChange
            }
        }
    },
    template: `
        <div class="relative">
            <input 
                ref="dateInput"
                type="text" 
                class="absolute top-full left-0 opacity-0 pointer-events-none w-0 h-0" 
                :placeholder="placeholder"
            >
            <!-- Custom Trigger Button (slot or default) -->
            <div @click="open" class="cursor-pointer">
                <slot>
                     <button class="h-11 w-11 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none">
                        <img src="./assets/images/icons/callender.svg" alt="Date">
                    </button>
                </slot>
            </div>
        </div>
    `
}
