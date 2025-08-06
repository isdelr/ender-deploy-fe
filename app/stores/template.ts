import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

// --- Interface Definition (unchanged) ---
type Template = {
    id: string;
    name: string;
    description: string;
    minecraftVersion: string;
    javaVersion: string;
    serverType: 'Vanilla' | 'Forge' | 'Fabric' | 'Paper'; // Standard install type
    modpackType?: string; // e.g., "CURSEFORGE", "FTB"
    modpackURL?: string; // URL to the modpack page or file
    minMemoryMB: number;
    maxMemoryMB: number;
    tags: string[];
    jvmArgs?: string[];
    properties?: Record<string, string>;
};

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [] as Template[],
    isLoading: false,
  }),
  actions: {
    async fetchTemplates() {
      this.isLoading = true;
      const { data } = await useApiFetch<Template[]>('/templates');
      if (data.value) {
        this.templates = data.value;
      }
      this.isLoading = false;
      return this.templates; // Return data
    },
    async saveTemplate(templateData: any) {
        const isEditing = !!templateData.id;
        const url = isEditing ? `/templates/${templateData.id}` : '/templates';
        const method = isEditing ? 'PUT' : 'POST';

        const { error } = await useApiFetch(url, { method, body: templateData });

        if(error.value) throw error.value;

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