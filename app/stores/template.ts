import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

// --- MODIFIED: Template interface now matches the new backend model ---
type Template = {
    id: string;
    name: string;
    description: string;
    minecraftVersion: string;
    javaVersion: string;
    serverType: string;
    serverExecutableURL?: string; // URL to the server JAR file
    startupCommand?: string;
    minMemoryMB: number;
    maxMemoryMB: number;
    tags: string[];
    jvmArgs?: string[];
    properties?: Record<string, string>;
};

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [] as Template[],
    minecraftVersions: [] as string[],
    isLoading: false,
  }),
  actions: {
    async fetchMinecraftVersions() {
        try {
            const data = await $fetch<{ result: string[] }>('https://mc-versions-api.net/api/java');
            this.minecraftVersions = data.result;
        } catch (e) {
          console.error(
            "Failed to fetch Minecraft versions, using fallback.",
            e
          );
          // Fallback to a hardcoded list if the API fails for any reason
          this.minecraftVersions = [
            "1.21",
            "1.20.4",
            "1.20.1",
            "1.19.2",
            "1.18.2",
            "1.16.5",
          ];
        }
        return this.minecraftVersions;
    },
    async fetchTemplates() {
      this.isLoading = true;
      const { data } = await useApiFetch<Template[]>('/templates');
      if (data.value) {
        this.templates = data.value;
      }
      this.isLoading = false;
      return this.templates; // Return data
    },
     async createTemplateFromUpload(templateData: {
        name: string;
        description: string;
        javaVersion: string;
        minecraftVersion: string;
        serverExecutable: string;
        maxMemoryMB: number;
        file: File;
    }) {
        const formData = new FormData();
        formData.append('name', templateData.name);
        formData.append('description', templateData.description || '');
        formData.append('javaVersion', templateData.javaVersion);
        formData.append('minecraftVersion', templateData.minecraftVersion);
        formData.append('serverExecutable', templateData.serverExecutable);
        formData.append('maxMemoryMB', String(templateData.maxMemoryMB));
        formData.append('file', templateData.file);

        const { error } = await useApiFetch('/templates', {
            method: 'POST',
            body: formData,
        });

        if (error.value) {
            throw error.value;
        }

        await this.fetchTemplates();
    },
    async updateTemplate(templateData: Pick<Template, 'id' | 'name' | 'description'>) {
        const { error } = await useApiFetch(`/templates/${templateData.id}`, {
            method: 'PUT',
            body: templateData,
        });

        if (error.value) throw error.value;

        await this.fetchTemplates();
    },
    async deleteTemplate(templateId: string) {
        const { error } = await useApiFetch(`/templates/${templateId}`, {
            method: 'DELETE',
        });
        if (error.value) throw error.value;
        this.templates = this.templates.filter(t => t.id !== templateId);
    }
  },
});