export default {
    name: 'SearchInput',
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Search'
        },
        width: {
            type: String,
            default: 'w-64'
        }
    },
    emits: ['update:modelValue'],
    template: `
        <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </span>
            <input 
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                type="text" 
                :placeholder="placeholder" 
                :class="['pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent', width]"
            />
        </div>
    `
}
