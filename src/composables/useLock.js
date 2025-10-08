import { ref } from 'vue';

/**
 * Composable for managing DataTable locking features (row locking and column freezing)
 * Handles both frozen/locked rows and frozen columns functionality
 */
export function useLock(defaultFields = [], recordsRef = null) {
    // Row locking state
    const lockedRow = ref([]);

    // Column freezing state - initialize frozen state for all provided fields
    const frozenColumns = ref(
        defaultFields.reduce((acc, field) => {
            acc[field] = false;
            return acc;
        }, {})
    );

    // === ROW LOCKING FUNCTIONS ===

    /**
     * Toggle the lock state of a row
     * @param {Object} data - Row data object
     * @param {boolean} frozen - Current frozen state
     * @param {number} index - Row index
     */
    const toggleLock = (data, frozen, index) => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }

        if (frozen) {
            // Unlock: remove from locked rows and add back to main records
            lockedRow.value = lockedRow.value.filter((c, i) => i !== index);
            recordsRef.value = [...recordsRef.value, data];
        } else {
            // Lock: remove from main records and add to locked rows
            recordsRef.value = recordsRef.value.filter((c, i) => i !== index);
            lockedRow.value = [...lockedRow.value, data];
        }
        // Keep records sorted by ID
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    /**
     * Clear all locked rows
     */
    const clearAllLocks = () => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }
        recordsRef.value = [...recordsRef.value, ...lockedRow.value];
        lockedRow.value = [];
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    /**
     * Check if a row is locked
     * @param {string|number} id - Row ID
     * @returns {boolean}
     */
    const isRowLocked = (id) => {
        return lockedRow.value.some((row) => row.id === id);
    };

    // === COLUMN FREEZING FUNCTIONS ===

    /**
     * Toggle the frozen state of a column
     * @param {string} column - Column field name
     */
    const toggleColumnFrozen = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: !frozenColumns.value[column]
        };
    };

    /**
     * Freeze a specific column
     * @param {string} column - Column field name
     */
    const freezeColumn = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: true
        };
    };

    /**
     * Unfreeze a specific column
     * @param {string} column - Column field name
     */
    const unfreezeColumn = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: false
        };
    };

    /**
     * Unfreeze all columns
     */
    const unfreezeAllColumns = () => {
        Object.keys(frozenColumns.value).forEach((column) => {
            frozenColumns.value[column] = false;
        });
    };

    /**
     * Check if a column is frozen
     * @param {string} column - Column field name
     * @returns {boolean}
     */
    const isColumnFrozen = (column) => {
        return !!frozenColumns.value[column];
    };

    /**
     * Get all frozen columns
     * @returns {string[]} Array of frozen column field names
     */
    const getFrozenColumns = () => {
        return Object.keys(frozenColumns.value).filter((column) => frozenColumns.value[column]);
    };

    /**
     * Add a new column to the frozen columns state
     * @param {string} column - Column field name
     * @param {boolean} frozen - Initial frozen state (default: false)
     */
    const addColumn = (column, frozen = false) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: frozen
        };
    };

    /**
     * Remove a column from the frozen columns state
     * @param {string} column - Column field name
     */
    const removeColumn = (column) => {
        const { [column]: _omit, ...rest } = frozenColumns.value;
        frozenColumns.value = rest;
    };

    return {
        // Row locking
        lockedRow,
        toggleLock,
        clearAllLocks,
        isRowLocked,

        // Column freezing
        frozenColumns,
        toggleColumnFrozen,
        freezeColumn,
        unfreezeColumn,
        unfreezeAllColumns,
        isColumnFrozen,
        getFrozenColumns,
        addColumn,
        removeColumn
    };
}
