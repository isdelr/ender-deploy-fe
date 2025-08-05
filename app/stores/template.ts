import { defineStore } from 'pinia';
import { useApiFetch } from '~/composables/useApiFetch';

type Template = {
    id: string;
    name: string;
    description: string;
    minecraftVersion: string;
    javaVersion: string;
    serverType: 'Vanilla' | 'Forge' | 'Fabric' | 'Paper';
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
      const { data, error } = await useApiFetch<Template[]>('/templates');
      if (data.value) {
        this.templates = data.value;
      }
      this.isLoading = false;
    },
    async saveTemplate(templateData: any) {
        const isEditing = !!templateData.id;
        const url = isEditing ? `/templates/${templateData.id}` : '/templates';
        const method = isEditing ? 'PUT' : 'POST';

        const { data, error } = await useApiFetch(url, {
            method: method,
            body: templateData
        });

        if(error.value) throw error.value;

        await this.fetchTemplates(); // Refresh the list
    }
  },
});