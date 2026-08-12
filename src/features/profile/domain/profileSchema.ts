import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  bio: z.string().trim().max(280, 'Bio must be at most 280 characters'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const emptyProfileFormData: ProfileFormData = {
  displayName: '',
  email: '',
  bio: '',
};
