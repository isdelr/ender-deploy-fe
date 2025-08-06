<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useServerStore } from '~/stores/server';
import { toast } from 'vue-sonner';

const props = defineProps<{
  modelValue: boolean; // For v-model:open
  serverId: string;
  filePath: string;
}>();

const emit = defineEmits(['update:modelValue']);

const serverStore = useServerStore();
const fileContent = ref('');
const isSaving = ref(false);

const isSheetOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Watch when the sheet opens to fetch file content
watch(() => props.modelValue, async (newValue) => {
  if (newValue && props.serverId && props.filePath) {
    fileContent.value = ''; // Reset content
    try {
        await serverStore.fetchFileContent(props.serverId, props.filePath);
        fileContent.value = serverStore.currentFileContent || '';
    } catch (error) {
        toast.error('Failed to load file content.');
        isSheetOpen.value = false; // Close sheet on error
    }
  }
});

const handleSave = async () => {
    isSaving.value = true;
    toast.promise(serverStore.updateFileContent(props.serverId, props.filePath, fileContent.value), {
        loading: 'Saving file...',
        success: () => {
            isSheetOpen.value = false;
            return 'File saved successfully!';
        },
        error: (err: any) => err.data?.message || 'Failed to save file.',
        finally: () => {
            isSaving.value = false;
        }
    });
};

</script>

<template>
  <Sheet :open="isSheetOpen" @update:open="isSheetOpen = $event">
    <SheetContent class="sm:max-w-2xl w-full p-0" side="right">
      <div class="flex flex-col h-full">
        <SheetHeader class="p-6">
          <SheetTitle>Edit File</SheetTitle>
          <SheetDescription class="font-mono">{{ filePath }}</SheetDescription>
        </SheetHeader>
        <div class="flex-grow p-6 pt-0">
            <div v-if="serverStore.isLoadingFileContent" class="flex items-center justify-center h-full">
                <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <Textarea 
                v-else
                v-model="fileContent"
                class="h-full w-full resize-none font-mono text-xs"
                placeholder="File is empty or content is loading..."
            />
        </div>
        <SheetFooter class="p-6 border-t mt-auto bg-background/95">
          <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
          <Button type="submit" @click="handleSave" :disabled="isSaving || serverStore.isLoadingFileContent">
             <Icon v-if="isSaving" name="lucide:loader-circle" class="animate-spin mr-2" />
             Save Changes
          </Button>
        </SheetFooter>
      </div>
    </SheetContent>
  </Sheet>
</template>