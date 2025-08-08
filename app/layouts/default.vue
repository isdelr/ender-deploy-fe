<script setup lang="ts">
import { useServerStore } from '~/stores/server';
import 'vue-sonner/style.css'

const config = useRuntimeConfig();
const serverStore = useServerStore();
const { status, data, send, open, close } = useWebSocket(`${config.public.wsBase}/global`); // A global endpoint if available, or just listen on a dummy one for broadcasts.

watch(data, (newValue) => {
  try {
    const message = JSON.parse(newValue);
    if (message.action === 'server_update') {
      serverStore.updateServerFromBroadcast(message.payload);
    }
  } catch (e) {
    console.error("Failed to parse WebSocket message:", e);
  }
});

onMounted(() => {
  // You might want to handle reconnection logic here
});
</script>

<template>
  <SidebarProvider>
    <div class="flex min-h-svh w-full">
      <LeftSidebar />
      <SidebarInset>
        <div class="p-4 md:p-6 lg:p-8">
          <slot />
        </div>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>