import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

interface User {
  id: string;
  username:string;
  email: string;
  createdAt: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useCookie('token').value || null,
    user: null as User | null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
  },
  actions: {
    async fetchUser() {
      if (this.user) return; // Don't fetch if user is already loaded

      if (!this.token) return; // Can't fetch user without a token

      try {
        const { data } = await useApiFetch<User>('/users/me'); // A dedicated endpoint to get the current user
        this.user = data.value;
      } catch (e) {
        this.logout(); // If fetching the user fails, the token is likely invalid, so log out.
      }
    },
    async login(email: string, password: string) {
      const { data, error } = await useApiFetch<any>('/login', {
        method: 'POST',
        body: { email, password },
      });

      if (error.value) {
        throw error.value;
      }

      if (data.value) {
        const tokenCookie = useCookie('token', { maxAge: 60 * 60 * 24 * 7 }); // 7 days
        tokenCookie.value = data.value.token;
        this.token = data.value.token;
        this.user = data.value.user;
      }
    },
    async register(username: string, email: string, password: string) {
      const { error } = await useApiFetch('/register', {
        method: 'POST',
        body: { username, email, password },
      });

      if (error.value) {
        throw error.value;
      }
    },
    logout() {
      const tokenCookie = useCookie('token');
      tokenCookie.value = null;
      this.token = null;
      this.user = null;
      navigateTo('/login');
    },
    async updateUser(userData: { username: string, email: string }) {
      if (!this.user) return;
      const { data, error } = await useApiFetch(`/users/${this.user.id}`, {
        method: 'PUT',
        body: userData,
      });
      if (error.value) throw error.value;
      if (data.value) this.user = { ...this.user, ...data.value };
    },
    async changePassword(passwords: { currentPassword: string, newPassword: string }) {
      if (!this.user) return;
      const { error } = await useApiFetch(`/users/${this.user.id}/change-password`, {
        method: 'POST',
        body: passwords,
      });
      if (error.value) throw error.value;
    },
    async deleteAccount() {
      if (!this.user) return;
      const { error } = await useApiFetch(`/users/${this.user.id}`, {
        method: 'DELETE'
      });
      if (error.value) throw error.value;
      this.logout();
    }
  },
});