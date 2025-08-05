import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

export interface Schedule {
  id: string;
  serverId: string;
  name: string;
  cronExpression: string;
  taskType: string;
  payload: Record<string, any>;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [] as Schedule[],
    isLoading: false,
  }),
  actions: {
    async fetchSchedules(serverId: string) {
      this.isLoading = true;
      const { data } = await useApiFetch<Schedule[]>(`/servers/${serverId}/schedules`);
      if (data.value) {
        this.schedules = data.value;
      }
      this.isLoading = false;
    },
    async saveSchedule(schedule: Omit<Schedule, 'id'> & { id?: string }) {
      const isEditing = !!schedule.id;
      const url = isEditing ? `/servers/${schedule.serverId}/schedules/${schedule.id}` : `/servers/${schedule.serverId}/schedules`;
      const method = isEditing ? 'PUT' : 'POST';

      const { error } = await useApiFetch(url, {
        method,
        body: schedule,
      });

      if (error.value) throw error.value;
      
      await this.fetchSchedules(schedule.serverId);
    },
    async deleteSchedule(serverId: string, scheduleId: string) {
        const { error } = await useApiFetch(`/servers/${serverId}/schedules/${scheduleId}`, {
            method: 'DELETE',
        });
        if (error.value) throw error.value;
        this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    }
  },
});