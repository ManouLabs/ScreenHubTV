import { z } from 'zod';

// Helpers to normalize null/undefined to proper validation expectations
export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const optionalString = z.string().nullable().optional();

// Campaign-specific field validators
const campaignName = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(255, { message: 'Name cannot exceed 255 characters' }));

const campaignDefaultMedia = z.preprocess((v) => (v === null || v === undefined || v === '' ? null : v), z.string().max(255, { message: 'Default media cannot exceed 255 characters' }).nullable().optional());

export const campaignSchema = z
    .object({
        name: campaignName,
        start_date: z.string().nullable().optional(),
        end_date: z.string().nullable().optional(),
        default_media: campaignDefaultMedia,
        active: z.boolean().default(true)
    })
    .refine(
        (data) => {
            // If both dates are provided, end_date must be after start_date
            if (data.start_date && data.end_date) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(data.end_date);
                return endDate > startDate;
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
            // Optional: Check if start date is not in the past
            if (data.start_date) {
                const startDate = new Date(data.start_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return startDate >= today;
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
