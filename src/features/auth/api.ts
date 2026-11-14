import { baseApi } from '@/shared/lib/api';
import {
  useAadLoginCreateMutation as useGeneratedAadLoginCreateMutation,
  generatedApi,
  useLogoutCreateMutation,
  useRefreshTokenCreateMutation,
  useUsersAvatarDestroyMutation,
  useUsersMeRetrieveQuery as useGeneratedUsersMeRetrieveQuery,
} from '@/shared/api/generated/api';

// These are aliases to generated operations; only multipart avatar upload below
// remains custom because the current OpenAPI schema describes a JSON write body.
export const useRefreshTokenMutation = useRefreshTokenCreateMutation;
export const useLogoutMutation = useLogoutCreateMutation;
export const useGetMeQuery = useGeneratedUsersMeRetrieveQuery;
export const useRemoveAvatarMutation = useUsersAvatarDestroyMutation;

const uploadAvatarApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAvatar: build.mutation<{ avatar: string }, FormData>({
      query: (body) => ({ url: '/api/users/avatar', method: 'POST', body }),
      transformResponse: (response: unknown): { avatar: string } => {
        if (typeof response !== 'object' || response === null || !('data' in response)) {
          throw new Error('Avatar upload returned an invalid response');
        }
        const data = (response as { data?: { avatar_url?: string | null } }).data;
        if (!data || typeof data.avatar_url === 'undefined') {
          throw new Error('Avatar upload response is missing avatar_url');
        }
        return { avatar: data.avatar_url ?? '' };
      },
    }),
  }),
  overrideExisting: false,
});

export const useUploadAvatarMutation = uploadAvatarApi.useUploadAvatarMutation;

export const useAadLoginMutation = useGeneratedAadLoginCreateMutation;
export const requestLoginCsrfToken = generatedApi.endpoints.csrfTokenRetrieve.initiate;
