import { z } from 'zod';

export const screenOnboardingSchema = z.object({
    device_id: z.string().min(1, { message: 'common.messages.is_required' }),
    group_id: z.number({ required_error: 'common.messages.is_required' }),
    screen_number: z.number({ required_error: 'common.messages.is_required' }).int({ message: 'common.messages.must_be_integer' }).positive({ message: 'common.messages.must_be_positive' })
});
