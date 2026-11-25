import type { UsersRetrieveApiResponse } from '@/shared/api/generated/api';

export function mapUserOptions(response: UsersRetrieveApiResponse) {
  const data = Array.isArray(response?.data) ? response.data : [];
  return data.map((user) => ({
    id: user.id,
    username: user.username,
    ...(user.display_name ? { display_name: user.display_name } : {}),
  }));
}
