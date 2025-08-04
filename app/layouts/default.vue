<script setup lang="ts">
</script>

<template>
  <SidebarProvider>
    <div class="flex min-h-svh w-full">
      <LeftSidebar />
      <SidebarInset>
        <div class="p-4">
          <slot />
        </div>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>