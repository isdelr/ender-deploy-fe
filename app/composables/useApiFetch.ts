import { useAuthStore } from '~/stores/auth';

export const useApiFetch = <T>(path: string, options: any = {}) => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const defaults = {
    baseURL: config.public.apiBase,
    headers: {
      ... (authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    onResponseError({ response }: any) {
        if (response.status === 401) {
            authStore.logout();
        }
    }
  };

  const params = { ...defaults, ...options };
  params.headers = { ...defaults.headers, ...options.headers };

  return useFetch<T>(path, params);
};