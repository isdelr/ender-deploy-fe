import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

// Match the Go backend models
type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping';

export interface FileInfo {
    name: string;
    size: number;
    isDir: boolean;
    modified: string;
}

export interface OnlinePlayer {
    uuid: string;
    name: string;
}

export interface ResourceDataPoint {
  timestamp: string;
  cpuUsage: number;
  ramUsage: number;
  playersCurrent: number;
}


interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  minecraftVersion: string;
  modpack?: {
    name: string;
    version: string;
  };
  javaVersion: string;
  players: { current: number; max: number };
  resources: { cpu: number; ram: number; storage: number };
  ipAddress: string;
  port: number;
  settings?: Record<string, any>; // Changed to allow boolean/number parsing
}


export const useServerStore = defineStore('server', {
  state: () => ({
    servers: [] as Server[],
    currentServer: null as Server | null,
    isLoadingList: false,
    isLoadingCurrent: false,
    isLoadingSettings: false,
  }),
  actions: {
    async fetchServers() {
      this.isLoadingList = true;
      const { data, error } = await useApiFetch<Server[]>('/servers');
      if (data.value) {
        this.servers = data.value;
      }
      this.isLoadingList = false;
    },
    async fetchServerById(id: string) {
        this.isLoadingCurrent = true;
        const { data, error } = await useApiFetch<Server>(`/servers/${id}`);
        if(data.value) {
            this.currentServer = data.value;
        } else {
            this.currentServer = null;
        }
        this.isLoadingCurrent = false;
        return this.currentServer;
    },
    async fetchSettings(id: string) {
        if (!this.currentServer) return;
        this.isLoadingSettings = true;
        const { data } = await useApiFetch<Record<string, string>>(`/servers/${id}/settings`);
        if (data.value) {
            // Convert string booleans and numbers for form controls
            const settings = data.value;
            Object.keys(settings).forEach(key => {
                if (settings[key] === 'true') {
                    settings[key] = true;
                } else if (settings[key] === 'false') {
                    settings[key] = false;
                } else if (!isNaN(Number(settings[key]))) {
                     // Check if it's a number-like string that isn't just a simple integer, to avoid converting version strings
                    if (String(Number(settings[key])) === settings[key]) {
                       // settings[key] = Number(settings[key]);
                    }
                }
            });
            this.currentServer.settings = settings;
        }
        this.isLoadingSettings = false;
    },
    async createServer(name: string, templateId: string) {
        const { data, error } = await useApiFetch<Server>('/servers', {
            method: 'POST',
            body: { name, templateId }
        });
        if(error.value) throw error.value;
        if(data.value) {
            this.servers.push(data.value);
        }
    },
    async performServerAction(id: string, action: 'start' | 'stop' | 'restart') {
        const { error } = await useApiFetch(`/servers/${id}/action`, {
            method: 'POST',
            body: { action }
        });
        if(error.value) throw error.value;
    },
    async kickPlayer(id: string, playerName: string, reason: string) {
        const { error } = await useApiFetch(`/servers/${id}/players/manage`, {
            method: 'POST',
            body: { action: 'kick', player: playerName, reason }
        });
        if (error.value) throw error.value;
    },
    async deleteServer(id: string) {
        const { error } = await useApiFetch(`/servers/${id}`, {
            method: 'DELETE'
        });
        if(error.value) throw error.value;
        this.servers = this.servers.filter(s => s.id !== id);
    },
    async saveSettings(id: string, settings: Record<string, any>) {
        const { error } = await useApiFetch(`/servers/${id}/settings`, {
            method: 'POST',
            body: settings,
        });
        if(error.value) throw error.value;
    },
    updateServerFromBroadcast(updatedServer: Server) {
        const index = this.servers.findIndex(s => s.id === updatedServer.id);
        if (index !== -1) {
            // Preserve reactivity by updating properties
            Object.assign(this.servers[index], updatedServer);
        }
        if (this.currentServer && this.currentServer.id === updatedServer.id) {
            Object.assign(this.currentServer, updatedServer);
        }
    }
  },
});