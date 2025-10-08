import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams } from '@/utilities/helper';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { ref } from 'vue';

/**
 * Composable for managing common DataTable operations like pagination, filtering, sorting
 * @param {Function} dataFetcher - Function that fetches data (should return a promise)
 * @param {Object} defaultFiltersConfig - Configuration for default filters
 * @param {number} debounceDelay - Debounce delay for data loading (default: 150ms)
 */
export function useDataTable(dataFetcher, defaultFiltersConfig = {}, debounceDelay = 150) {
    const loading = useLoading();
    const lazyParams = ref({});
    const total = ref(0);
    const rows = ref(10);
    const records = ref([]);
    const selectedRecords = ref([]);
    const recordDataTable = ref(null);

    // Create default filters based on configuration
    function getDefaultFilters() {
        const defaultFilters = {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };

        // Add configured filters
        Object.entries(defaultFiltersConfig).forEach(([field, matchMode]) => {
            defaultFilters[field] = { value: null, matchMode };
        });

        return defaultFilters;
    }

    const filters = ref(getDefaultFilters());

    /**
     * Reset page to 0
     */
    const resetPages = () => {
        lazyParams.value.page = 0;
    };

    /**
     * Load data with debouncing
     */
    const loadLazyData = debounce(async () => {
        lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();

        try {
            loading.startDataLoading();
            const data = await dataFetcher(lazyParams.value);

            // Handle different response structures
            if (data.data) {
                records.value = data.data;
                total.value = data.meta?.total || data.total || 0;
                rows.value = data.meta?.per_page || data.per_page || 10;
            } else {
                records.value = data;
                total.value = data.length;
            }
        } catch (error) {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error fetching data:', error);
            records.value = [];
            total.value = 0;
        } finally {
            loading.stopDataLoading();
        }
    }, debounceDelay);

    /**
     * Handle page change events
     * @param {Object} event - Page event from DataTable
     */
    const onPage = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        loadLazyData();
    };

    /**
     * Handle sort events
     * @param {Object} event - Sort event from DataTable
     */
    const onSort = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        loadLazyData();
    };

    /**
     * Handle filter events
     * @param {Object} event - Filter event from DataTable
     */
    const onFilter = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        loadLazyData();
    };

    /**
     * Clear all filters and reload data
     */
    const clearFilter = () => {
        loading.startDataLoading();
        filters.value = getDefaultFilters();
        lazyParams.value = {};
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        loadLazyData();
    };

    /**
     * Execute search when user presses enter or clicks search
     */
    const searchDone = () => {
        loading.startDataLoading();
        lazyParams.value.filters = filters.value;
        resetPages();
        loadLazyData();
    };

    /**
     * Export data to CSV
     */
    const exportCSV = () => {
        if (recordDataTable.value) {
            recordDataTable.value.exportCSV();
        }
    };

    /**
     * Refresh data (reload current page)
     */
    const refresh = () => {
        loadLazyData();
    };

    /**
     * Initialize data loading
     */
    const initialize = () => {
        loadLazyData();
    };

    return {
        // Refs
        total,
        rows,
        records,
        selectedRecords,
        recordDataTable,
        filters,

        // Methods
        onPage,
        onSort,
        onFilter,
        clearFilter,
        searchDone,
        exportCSV,
        refresh,
        initialize,
        loadLazyData,
        resetPages,
        getDefaultFilters
    };
}
