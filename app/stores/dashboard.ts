import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

// Define types according to the backend models
interface ResourceDataPoint {
    timestamp: string;
    cpuUsage: number;
    ramUsage: number;
    playersCurrent: number;
}

interface DashboardStats {
    totalServers: number;
    onlineServers: number;
    totalPlayers: number;
    maxPlayers: number;
    systemHealth: number;
    serverStatusDist: Record<string, number>;
    playerHistory: ResourceDataPoint[];
    resourceHistory: ResourceDataPoint[];
}

interface Event {
    id: string;
    type: string;
    level: string;
    message: string;
    serverId?: string;
    createdAt: string;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: null as DashboardStats | null,
    recentEvents: [] as Event[],
    isLoading: false,
  }),
  actions: {
    async fetchDashboardData() {
      this.isLoading = true;
      const [{ data: statsData }, { data: eventsData }] = await Promise.all([
        useApiFetch<DashboardStats>('/dashboard/stats'),
        useApiFetch<Event[]>('/events?limit=5')
      ]);

      if (statsData.value) {
        this.stats = statsData.value;
      }
      if (eventsData.value) {
        this.recentEvents = eventsData.value;
      }
      this.isLoading = false;
    },
  },
});