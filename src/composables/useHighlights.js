import { ref } from 'vue';

/**
 * Composable for managing transient highlights on data table records
 * Used to highlight newly added/updated records with auto-clear functionality
 */
export function useHighlights() {
    // Transient highlights for newly added/updated records
    const highlights = ref({}); // { [id]: 'new' | 'updated' }

    /**
     * Mark a record with a highlight type that auto-clears after duration
     * @param {string|number} id - Record ID to highlight
     * @param {'new'|'updated'} type - Type of highlight
     * @param {number} duration - Duration in milliseconds (default: 12000)
     */
    function markHighlight(id, type, duration = 12000) {
        // set highlight
        highlights.value = { ...highlights.value, [id]: type };
        // auto clear after duration; only clear if unchanged type
        setTimeout(() => {
            if (highlights.value[id] === type) {
                const { [id]: _omit, ...rest } = highlights.value;
                highlights.value = rest;
            }
        }, duration);
    }

    /**
     * Get row class for DataTable rowClass prop
     * Makes entire highlighted row bold
     * @param {Object} data - Row data object
     * @returns {Object} Class object for the row
     */
    function getRowClass(data) {
        return { 'font-bold': !!highlights.value?.[data.id] };
    }

    /**
     * Clear all highlights immediately
     */
    function clearHighlights() {
        highlights.value = {};
    }

    /**
     * Clear specific highlight by ID
     * @param {string|number} id - Record ID to clear
     */
    function clearHighlight(id) {
        const { [id]: _omit, ...rest } = highlights.value;
        highlights.value = rest;
    }

    return {
        highlights,
        markHighlight,
        getRowClass,
        clearHighlights,
        clearHighlight
    };
}
