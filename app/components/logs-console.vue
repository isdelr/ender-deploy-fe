<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import {AnsiUp} from 'ansi_up';

const props = defineProps<{
  logs: string[];
}>();

const scrollArea = ref<HTMLElement | null>(null);
const ansiUp = new AnsiUp();

watch(() => props.logs, () => {
  nextTick(() => {
    const viewport = (scrollArea.value as any)?.$el?.querySelector('[data-reka-scroll-area-viewport]');
    if (viewport) {
      const isScrolledToBottom = viewport.scrollHeight - viewport.clientHeight <= viewport.scrollTop + 5; // 5px buffer
      if (isScrolledToBottom) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  });
}, { deep: true });
</script>
<template>
  <Card class="h-[600px] flex flex-col">
    <CardContent class="p-0 flex-1">
      <ScrollArea ref="scrollArea" class="h-full p-4 bg-gray-900/95 dark:bg-black/80 rounded-xl">
        <pre class="text-xs font-mono text-white whitespace-pre-wrap break-words leading-snug">
          <div v-for="(log, index) in logs" :key="index" v-html="ansiUp.ansi_to_html(log)"></div>
        </pre>
      </ScrollArea>
    </CardContent>
  </Card>
</template>