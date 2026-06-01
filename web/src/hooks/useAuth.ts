import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/api';

export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login({ username, password }),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: !!localStorage.getItem('token'),
  });
}
