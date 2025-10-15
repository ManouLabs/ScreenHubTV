import { z } from 'zod';

export const locationSchema = z.object({
    name: z.string().min(1, { message: 'common.messages.is_required' })
});
