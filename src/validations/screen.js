import { z } from 'zod';

export const screenOnboardingSchema = z.object({
    location_id: z.number({ required_error: 'common.messages.is_required' }),
    group_id: z.number({ required_error: 'common.messages.is_required' }),
    screen_number: z.number({ required_error: 'common.messages.is_required' }).int({ message: 'common.messages.must_be_integer' }).positive({ message: 'common.messages.must_be_positive' })
});
