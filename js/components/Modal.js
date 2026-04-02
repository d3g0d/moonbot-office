export default {
    name: 'Modal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        maxWidth: {
            type: String,
            default: 'max-w-md'
        }
    },
    emits: ['close'],
    methods: {
        close() {
            this.$emit('close');
        }
    },
    template: `
        <teleport to="body">
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
                <!-- Backdrop -->
                <div @click="close" class="absolute inset-0 bg-black bg-opacity-50"></div>
                
                <!-- Modal Content -->
                <div :class="['relative bg-white rounded-xl shadow-2xl w-full mx-4 p-6', maxWidth]">
                    <h2 v-if="title" class="text-xl font-semibold text-gray-900 mb-6">
                        {{ title }}
                    </h2>
                    
                    <slot></slot>
                    
                    <!-- Footer slot for buttons -->
                    <div v-if="$slots.footer" class="flex justify-end gap-3 mt-6">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </teleport>
    `
}
