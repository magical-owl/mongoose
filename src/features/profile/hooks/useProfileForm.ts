import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/ProfileService';
import {
  emptyProfileFormData,
  profileSchema,
  type ProfileFormData,
} from '../domain/profileSchema';

const profileQueryKey = ['profile', 'current'] as const;

export function useProfileForm() {
  const queryClient = useQueryClient();
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyProfileFormData,
    mode: 'onChange',
  });

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => profileService.getCurrentProfile(),
  });

  useEffect(() => {
    if (profileQuery.data?.success) {
      const profile = profileQuery.data.data;
      form.reset(profile ?? emptyProfileFormData);
    }
  }, [form, profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (input: ProfileFormData) => profileService.saveProfile(input),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: profileQueryKey });
        form.reset(result.data);
      }
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => profileService.clearProfile(),
    onSuccess: async (result) => {
      if (result.success) {
        queryClient.setQueryData(profileQueryKey, result);
        form.reset(emptyProfileFormData);
      }
    },
  });

  return {
    ...form,
    profile: profileQuery.data?.success ? profileQuery.data.data : null,
    isLoading: profileQuery.isLoading,
    loadError: profileQuery.data && !profileQuery.data.success ? profileQuery.data.error : null,
    saveProfile: saveMutation.mutateAsync,
    clearProfile: clearMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
