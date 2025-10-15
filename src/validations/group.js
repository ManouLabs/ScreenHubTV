import { z } from 'zod';

export const groupSchema = z.object({
    name: z.string().min(1, { message: 'common.messages.is_required' }),
    location_id: z.number({ required_error: 'common.messages.is_required' })
});
