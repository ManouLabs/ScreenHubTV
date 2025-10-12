import { z } from 'zod';

// Helpers to normalize null/undefined to proper validation expectations
export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const optionalString = z.string().nullable().optional();

// Campaign-specific field validators
const campaignName = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(255, { message: 'Name cannot exceed 255 characters' }));

// Default media can be:
// - File (new upload)
// - string (existing URL/path)
// - object from API ({ id, url, original_name, mime_type, size, ... })
const mediaObject = z
    .object({
        id: z.number().optional(),
        url: z.string().url().optional(),
        path: z.string().optional(),
        original_name: z.string().optional(),
        mime_type: z.string().optional(),
        size: z.number().optional()
    })
    .partial();

const campaignDefaultMedia = z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z
        .union([z.instanceof(File), z.string(), mediaObject])
        .nullable()
        .optional()
);

// Accept Date objects from the DatePicker or formatted strings; normalize empty to null
const dateField = z.preprocess(
    (v) => {
        if (v === null || v === undefined || v === '') return null;
        if (v instanceof Date) return v;
        if (typeof v === 'string') return v;
        return v; // leave as-is; downstream union will reject invalid types
    },
    z.union([z.date(), z.string()]).nullable().optional()
);

const asDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

export const campaignSchema = z
    .object({
        name: campaignName,
        start_date: dateField,
        end_date: dateField,
        default_media: campaignDefaultMedia,
        active: z.boolean().default(true),
        // Used only on edit to allow keeping the original start_date even if it's in the past
        __original_start_date: dateField
    })
    .refine(
        (data) => {
            // If both dates are provided, end_date must be after start_date
            if (data.start_date && data.end_date) {
                const startDate = asDate(data.start_date);
                const endDate = asDate(data.end_date);
                if (!startDate || !endDate) return false;
                return endDate >= startDate;
            }
            return true;
        },
        {
            message: 'End date must be after start date',
            path: ['end_date']
        }
    )
    .refine(
        (data) => {
            // Check if start date is not in the past, unless equal to the original (edit mode)
            if (data.start_date) {
                const startDate = asDate(data.start_date);
                if (!startDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (startDate >= today) return true;

                // Allow if editing and the selected date matches the originally saved date (same day)
                if (data.__original_start_date) {
                    const orig = asDate(data.__original_start_date);
                    if (orig) {
                        const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                        if (sameDay(startDate, orig)) return true;
                    }
                }
                return false;
            }
            return true;
        },
        {
            message: 'Start date cannot be in the past',
            path: ['start_date']
        }
    );

/**
 * Validate campaign name for uniqueness (client-side basic validation)
 * @param {string} name - Campaign name
 * @param {Array} existingCampaigns - Array of existing campaigns to check against
 * @param {number|string} currentId - Current campaign ID (for edit mode)
 * @returns {string|null} Error message or null if valid
 */
export function validateCampaignNameUniqueness(name, existingCampaigns = [], currentId = null) {
    if (!name) return null;

    const duplicate = existingCampaigns.find((campaign) => campaign.name.toLowerCase() === name.toLowerCase() && campaign.id !== currentId);

    return duplicate ? 'Campaign name already exists' : null;
}

/**
 * Validate campaign date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Object with start_date and end_date errors
 */
export function validateCampaignDateRange(startDate, endDate) {
    const errors = {};

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            errors.end_date = 'End date must be after start date';
        }

        // Check if start date is in the past (optional business rule)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            errors.start_date = 'Start date cannot be in the past';
        }
    }

    return errors;
}
