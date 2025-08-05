import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';
import { useEventBus } from '@vueuse/core';

export interface Backup {
  id: string;
  serverId: string;
  name: string;
  size: number;
  createdAt: string;
}

const backupBus = useEventBus<string>('backup-updated');

export const useBackupStore = defineStore('backup', {
  state: () => ({
    backups: [] as Backup[],
    isLoading: false,
  }),
  actions: {
    async fetchBackups(serverId: string) {
      this.isLoading = true;
      const { data, error } = await useApiFetch<Backup[]>(`/servers/${serverId}/backups`);
      if (data.value) {
        this.backups = data.value;
      }
      this.isLoading = false;
    },
    async createBackup(serverId: string, name: string) {
      const { error } = await useApiFetch(`/servers/${serverId}/backups`, {
        method: 'POST',
        body: { name },
      });
      if (error.value) throw error.value;
      // The backend processes this in the background. We'll rely on a server event or polling to see the result.
      // For now, we emit an event to trigger a refresh after a delay.
      setTimeout(() => backupBus.emit(serverId), 5000);
    },
    async deleteBackup(serverId: string, backupId: string) {
        const { error } = await useApiFetch(`/servers/${serverId}/backups/${backupId}`, {
            method: 'DELETE',
        });
        if(error.value) throw error.value;
        this.backups = this.backups.filter(b => b.id !== backupId);
    },
    async restoreBackup(serverId: string, backupId: string) {
        const { error } = await useApiFetch(`/servers/${serverId}/backups/${backupId}/restore`, {
            method: 'POST',
        });
        if(error.value) throw error.value;
        // Restore is a background task on the server.
    },
    onBackupUpdate(callback: (serverId: string) => void) {
      backupBus.on(callback);
    },
  },
});