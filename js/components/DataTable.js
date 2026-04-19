export default {
    name: 'DataTable',
    props: {
        columns: {
            type: Array,
            required: true
        },
        data: {
            type: Array,
            required: true
        },
        rowsPerPageOptions: {
            type: Array,
            default: () => [25, 50, 100]
        },
        defaultRowsPerPage: {
            type: Number,
            default: 25
        },
        stickyIndex: {
            type: Boolean,
            default: false
        },
        showActions: {
            type: Boolean,
            default: false
        },
        // Server-side pagination props
        serverSide: {
            type: Boolean,
            default: false
        },
        totalItems: {
            type: Number,
            default: 0
        },
        totalPages: {
            type: Number,
            default: 1
        },
        currentPage: {
            type: Number,
            default: 1
        },
        // Server-side sorting props
        sortBy: {
            type: String,
            default: ''
        },
        sortOrder: {
            type: String,
            default: 'asc'
        }
    },
    emits: ['row-action', 'page-change', 'update:currentPage', 'update:rowsPerPage', 'sort-change'],
    data() {
        return {
            internalRowsPerPage: this.defaultRowsPerPage,
            internalCurrentPage: 1,
            internalSortKey: this.sortBy,
            internalSortOrder: this.sortOrder
        }
    },
    computed: {
        sortKey() {
            return this.serverSide ? this.sortBy : this.internalSortKey;
        },
        activeSortOrder() {
            return this.serverSide ? this.sortOrder : this.internalSortOrder;
        },
        activeRowsPerPage() {
            return this.internalRowsPerPage;
        },
        activeCurrentPage() {
            return Math.max(1, this.serverSide ? this.currentPage : this.internalCurrentPage);
        },
        activeTotalPages() {
            const pages = this.serverSide ? this.totalPages : Math.ceil(this.data.length / this.activeRowsPerPage);
            return Math.max(1, pages);
        },
        activeTotalItems() {
            return this.serverSide ? this.totalItems : this.data.length;
        },
        sortedData() {
            const data = Array.isArray(this.data) ? this.data : [];
            if (!this.sortKey || this.serverSide) return data;

            return [...data].sort((a, b) => {
                let aVal = a[this.sortKey];
                let bVal = b[this.sortKey];

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return this.activeSortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.activeSortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedData() {
            if (this.serverSide) return this.sortedData;
            const data = this.sortedData;
            if (!Array.isArray(data)) return [];
            const start = (this.activeCurrentPage - 1) * this.activeRowsPerPage;
            return data.slice(start, start + this.activeRowsPerPage);
        },
        showingFrom() {
            if (this.activeTotalItems === 0) return 0;
            return (this.activeCurrentPage - 1) * this.activeRowsPerPage + 1;
        },
        showingTo() {
            return Math.min(this.activeCurrentPage * this.activeRowsPerPage, this.activeTotalItems);
        }
    },
    methods: {
        sort(column) {
            if (!column.sortable) return;

            let newKey = column.key;
            let newOrder = 'asc';

            if (this.sortKey === newKey) {
                newOrder = this.activeSortOrder === 'asc' ? 'desc' : 'asc';
            }

            if (this.serverSide) {
                this.$emit('sort-change', { key: newKey, order: newOrder });
            } else {
                this.internalSortKey = newKey;
                this.internalSortOrder = newOrder;
            }
        },
        prevPage() {
            if (this.activeCurrentPage > 1) {
                this.changePage(this.activeCurrentPage - 1);
            }
        },
        nextPage() {
            if (this.activeCurrentPage < this.activeTotalPages) {
                this.changePage(this.activeCurrentPage + 1);
            }
        },
        changePage(page) {
            if (this.serverSide) {
                this.$emit('update:currentPage', page);
                this.$emit('page-change', { page, rowsPerPage: this.activeRowsPerPage });
            } else {
                this.internalCurrentPage = page;
            }
        },
        getRowIndex(index) {
            return (this.activeCurrentPage - 1) * this.activeRowsPerPage + index + 1;
        }
    },
    watch: {
        data() {
            if (!this.serverSide) {
                this.internalCurrentPage = 1;
            }
        },
        internalRowsPerPage(newVal) {
            if (this.serverSide) {
                this.$emit('update:rowsPerPage', newVal);
                this.$emit('page-change', { page: 1, rowsPerPage: newVal });
            } else {
                this.internalCurrentPage = 1;
            }
        }
    },
    template: `
        <div class="bg-white border-t-2 border-b-2 border-gray-100">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-gray-600">
                    <thead class="sticky top-0 z-20 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <tr class="border-b border-gray-100">
                            <th :class="['px-3 md:px-4 py-3 font-semibold text-gray-500 text-xs w-10 md:w-16 min-w-[40px]', stickyIndex ? 'sticky left-0 bg-white z-30' : '']">#</th>
                            <th 
                                v-for="col in columns" 
                                :key="col.key"
                                :class="[
                                    'px-3 md:px-4 py-3 font-semibold text-gray-500 text-xs bg-white',
                                    col.align === 'center' ? 'text-center' : '',
                                    col.width ? col.width : '',
                                    col.thClass ? col.thClass : '',
                                    col.colWidthClass ? col.colWidthClass : ''
                                ]"
                                :style="!col.colWidthClass && col.colWidth ? { width: col.colWidth } : {}"
                            >
                                <div 
                                    :class="[
                                        'flex items-center gap-1 group',
                                        col.sortable ? 'cursor-pointer' : '',
                                        col.align === 'center' ? 'justify-center' : '',
                                        sortKey === col.key ? 'text-[#39DEBB]' : 'hover:text-gray-700'
                                    ]"
                                    @click="sort(col)"
                                >
                                    {{ col.label }}
                                    <div v-if="col.sortable" class="flex flex-col">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 -mb-1"
                                             :class="sortKey === col.key && activeSortOrder === 'asc' ? 'text-[#39DEBB]' : 'text-gray-300 group-hover:text-gray-400'" 
                                             fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 5L15 10H5L10 5Z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 -mt-1"
                                             :class="sortKey === col.key && activeSortOrder === 'desc' ? 'text-[#39DEBB]' : 'text-gray-300 group-hover:text-gray-400'" 
                                             fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 15L5 10H15L10 15Z" />
                                        </svg>
                                    </div>
                                </div>
                            </th>
                            <template v-if="showActions">
                                <slot name="action-header">
                                    <th class="px-4 py-3 font-semibold text-gray-500 text-xs text-center w-24">ACTION</th>
                                </slot>
                            </template>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <slot name="table-prepend"></slot>
                        <tr v-for="(row, index) in paginatedData" :key="row.id || index" class="hover:bg-gray-50 group">
                            <td :class="['px-3 md:px-4 py-2.5 text-gray-500 text-xs', stickyIndex ? 'sticky left-0 bg-white group-hover:bg-gray-50 z-10' : '']">{{ getRowIndex(index) }}</td>
                            <td 
                                v-for="col in columns" 
                                :key="col.key"
                                :class="[
                                    'px-4 py-2.5 text-xs',
                                    col.align === 'center' ? 'text-center' : '',
                                    col.class ? col.class : '',
                                    col.colWidthClass ? col.colWidthClass + ' break-all' : ''
                                ]"
                                :style="!col.colWidthClass && col.colWidth ? { width: col.colWidth, wordBreak: 'break-all', overflowWrap: 'break-word' } : {}"
                            >
                                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                                    {{ row[col.key] }}
                                </slot>
                            </td>
                            <td v-if="showActions" class="px-4 py-2.5 text-center text-xs">
                                <slot name="row-actions" :row="row" :index="index"></slot>
                            </td>
                        </tr>
                        <tr v-if="paginatedData.length === 0">
                            <td :colspan="columns.length + 2" class="px-6 py-8 text-center text-gray-400">
                                No data available
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="flex justify-between items-center px-6 py-2 border-t border-gray-100">
                <div class="text-[10px] md:text-xs text-gray-500">
                    {{ showingFrom }}-{{ showingTo }} of {{ activeTotalItems }}
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] md:text-xs text-gray-500">Rows per page:</span>
                        <select v-model="internalRowsPerPage" class="bg-transparent text-[10px] md:text-xs text-gray-700 focus:outline-none cursor-pointer">
                            <option v-for="opt in rowsPerPageOptions" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <button 
                            @click="prevPage"
                            :disabled="activeCurrentPage <= 1"
                            class="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span class="text-[10px] md:text-xs text-gray-700">{{ activeCurrentPage }}/{{ activeTotalPages }}</span>
                        <button 
                            @click="nextPage"
                            :disabled="activeCurrentPage >= activeTotalPages"
                            class="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}
