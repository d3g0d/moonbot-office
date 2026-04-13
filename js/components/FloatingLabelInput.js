export default {
    name: 'FloatingLabelInput',
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        label: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'text'
        },
        id: {
            type: String,
            required: true
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            isFocused: false
        }
    },
    computed: {
        isActive() {
            return this.isFocused || (this.modelValue && this.modelValue.length > 0);
        }
    },
    template: `
        <div class="relative">
            <input
                :id="id"
                :type="type"
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                @focus="isFocused = true"
                @blur="isFocused = false"
                class="block w-full px-4 pt-6 pb-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4EDAF6] focus:border-transparent transition-all duration-200 peer appearance-none font-medium"
                :class="{'border-[#4EDAF6]': isFocused}"
                placeholder=" "
            />
            <label
                :for="id"
                class="absolute left-4 text-gray-500 transition-all duration-200 pointer-events-none truncate max-w-[90%]"
                :class="[
                    isActive 
                        ? 'top-2 text-xs font-medium text-gray-700' 
                        : 'top-4 text-base text-gray-400'
                ]"
            >
                {{ label }}
            </label>
        </div>
    `
}
