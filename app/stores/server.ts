import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

// --- Interface Definitions (unchanged) ---
type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping';
export interface FileInfo { name: string; size: number; isDir: boolean; modified: string; }
export interface OnlinePlayer { uuid: string; name: string; }
export interface ResourceDataPoint { timestamp: string; cpuUsage: number; ramUsage: number; playersCurrent: number; }
interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  minecraftVersion: string;
  modpack?: { name: string; version: string; };
  javaVersion: string;
  players: { current: number; max: number };
  resources: { cpu: number; ram: number; storage: number };
  ipAddress: string;
  port: number;
  settings?: Record<string, any>;
}


export const useServerStore = defineStore('server', {
  state: () => ({
    servers: [] as Server[],
    currentServer: null as Server | null,
    isLoadingList: false,
    isLoadingCurrent: false,
    isLoadingSettings: false,
    currentFileContent: null as string | null,
    isLoadingFileContent: false,
  }),
  actions: {
    async fetchServers() {
      this.isLoadingList = true;
      const { data } = await useApiFetch<Server[]>('/servers');
      if (data.value) {
        this.servers = data.value;
      }
      this.isLoadingList = false;
      return this.servers; // Return data for useAsyncData
    },
    async fetchServerById(id: string) {
        this.isLoadingCurrent = true;
        const { data } = await useApiFetch<Server>(`/servers/${id}`);
        if(data.value) {
            this.currentServer = data.value;
        } else {
            this.currentServer = null;
        }
        this.isLoadingCurrent = false;
        return this.currentServer; // Return data
    },
    async fetchSettings(id: string) {
        if (!this.currentServer) return;
        this.isLoadingSettings = true;
        const { data } = await useApiFetch<Record<string, string>>(`/servers/${id}/settings`);
        if (data.value) {
            const settings = data.value;
            Object.keys(settings).forEach(key => {
                if (settings[key] === 'true') settings[key] = 'true';
                else if (settings[key] === 'false') settings[key] = 'false';
            });
            this.currentServer.settings = settings;
        }
        this.isLoadingSettings = false;
    },
    async createServer(name: string, templateId: string) {
        const { data, error } = await useApiFetch<Server>('/servers', { method: 'POST', body: { name, templateId } });
        if(error.value) throw error.value;
        if(data.value) this.servers.push(data.value);
    },
    async createServerFromUpload(name: string, javaVersion: string, maxMemoryMB: number, file: File) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('javaVersion', javaVersion);
        formData.append('maxMemoryMB', String(maxMemoryMB));
        formData.append('file', file);

        const { data, error } = await useApiFetch<Server>('/servers/upload', {
            method: 'POST',
            body: formData,
        });

        if (error.value) throw error.value;

        if (data.value) this.servers.push(data.value);
    },
    async performServerAction(id: string, action: 'start' | 'stop' | 'restart') {
        const { error } = await useApiFetch(`/servers/${id}/action`, { method: 'POST', body: { action } });
        if(error.value) throw error.value;
    },
    async kickPlayer(id: string, playerName: string, reason: string) {
        const { error } = await useApiFetch(`/servers/${id}/players/manage`, { method: 'POST', body: { action: 'kick', player: playerName, reason } });
        if (error.value) throw error.value;
    },
    async deleteServer(id: string) {
        const { error } = await useApiFetch(`/servers/${id}`, { method: 'DELETE' });
        if(error.value) throw error.value;
        this.servers = this.servers.filter(s => s.id !== id);
    },
    async saveSettings(id: string, settings: Record<string, any>) {
        const { error } = await useApiFetch(`/servers/${id}/settings`, { method: 'POST', body: settings, });
        if(error.value) throw error.value;
    },
    updateServerFromBroadcast(updatedServer: Server) {
        const index = this.servers.findIndex(s => s.id === updatedServer.id);
        if (index !== -1) Object.assign(this.servers[index], updatedServer);
        if (this.currentServer && this.currentServer.id === updatedServer.id) Object.assign(this.currentServer, updatedServer);
    },
    async fetchFileContent(id: string, path: string) {
        this.isLoadingFileContent = true;
        this.currentFileContent = null;
        const { data, error } = await useApiFetch<string>(`/servers/${id}/files/content?path=${encodeURIComponent(path)}`, {
            parseResponse: (responseText) => responseText,
        });
        if (error.value) {
            this.isLoadingFileContent = false;
            throw error.value;
        }
        this.currentFileContent = data.value;
        this.isLoadingFileContent = false;
        return data.value;
    },
    async updateFileContent(id: string, path: string, content: string) {
        const { error } = await useApiFetch(`/servers/${id}/files/update`, {
            method: 'POST',
            body: { path, content },
        });
        if (error.value) throw error.value;
    }
  },
});