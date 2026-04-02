export default {
    name: 'FormInput',
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
        required: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            default: ''
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    template: `
        <div class="mb-5">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ label }} <span v-if="required" class="text-red-500">*</span>
            </label>
            <input 
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                :type="type" 
                :required="required"
                :placeholder="placeholder"
                :disabled="disabled"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
        </div>
    `
}
