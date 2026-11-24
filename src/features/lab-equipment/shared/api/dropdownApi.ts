import { useUsersRetrieveQuery } from '@/shared/api/generated/api';
import { mapUserOptions } from './mapper';

interface IUserOption {
  id: number;
  username: string;
  display_name?: string;
}

export function useGetUsersQuery() {
  const result = useUsersRetrieveQuery({});
  return { ...result, data: result.data === undefined ? undefined : mapUserOptions(result.data) };
}

export type { IUserOption };
