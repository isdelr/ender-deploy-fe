<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import {AnsiUp} from 'ansi_up';

const props = defineProps<{
  history: string[];
}>();

const emit = defineEmits<{
  (e: 'command', command: string): void;
}>();

const commandInput = ref('');
const scrollArea = ref<HTMLElement | null>(null);
const ansiUp = new AnsiUp();

const sendCommand = () => {
  if (!commandInput.value) return;
  emit('command', commandInput.value);
  commandInput.value = '';
};

watch(() => props.history, () => {
  nextTick(() => {
    const viewport = (scrollArea.value as any)?.$el?.querySelector('[data-reka-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  });
}, { deep: true });
</script>

<template>
  <Card class="h-[600px] flex flex-col">
    <CardContent class="p-0 flex-1 flex flex-col">
      <ScrollArea ref="scrollArea" class="flex-1 p-4 bg-gray-900/95 dark:bg-black/80 rounded-t-xl">
        <pre class="text-xs font-mono text-white whitespace-pre-wrap break-words leading-snug">
          <div v-for="(line, index) in history" :key="index" v-html="ansiUp.ansi_to_html(line)"></div>
        </pre>
      </ScrollArea>
      <div class="p-2 border-t bg-card flex items-center gap-2">
        <Icon name="lucide:chevron-right" class="text-muted-foreground" />
        <Input 
          v-model="commandInput" 
          @keyup.enter="sendCommand" 
          placeholder="help, op <player>, etc..." 
          class="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" 
        />
        <Button @click="sendCommand">Send</Button>
      </div>
    </CardContent>
  </Card>
</template>