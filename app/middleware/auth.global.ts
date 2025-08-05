import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();

  // On the initial page load, fetch the user if a token exists
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser();
  }

  if (!authStore.isLoggedIn && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login');
  }
});