<script setup lang="ts">
import { computed } from "vue";

const colorMode = useColorMode();

const modes = ["light", "dark", "system"];

function cycleColorMode() {
  const currentMode = colorMode.preference;
  const currentIndex = modes.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  colorMode.preference = modes[nextIndex] || "system";
}

const colorModeIcon = computed(() => {
  switch (colorMode.value) {
    case "light":
      return "lucide:sun";
    case "dark":
      return "lucide:moon";
    case "system":
    default:
      return "lucide:laptop";
  }
});

const colorModeTooltip = computed(() => {
  const preference = colorMode.preference.charAt(0).toUpperCase() + colorMode.preference.slice(1);
  return `Theme: ${preference}`;
});
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <div class="flex items-center gap-2">
        <Icon name="mdi:minecraft" size="2rem" class="text-primary" />
        <span class="text-lg font-semibold">EnderDeploy</span>
      </div>
    </SidebarHeader>

    <SidebarContent class="p-2">
      <div class="mb-2">
        <Button size="lg" class="h-10 w-full justify-center">
          <Icon name="lucide:plus" class="size-5" />
          <span class="group-data-[collapsible=icon]:hidden">Create Server</span>
        </Button>
      </div>

      <SidebarMenu>
        <!-- Main Navigation -->
        <SidebarGroup class="mb-4">
          <SidebarMenuItem>
            <NuxtLink to="/">
              <SidebarMenuButton tooltip="Dashboard" :is-active="true">
                <Icon name="lucide:layout-dashboard" />
                <span class="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </SidebarMenuButton>
            </NuxtLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NuxtLink to="/servers">
              <SidebarMenuButton tooltip="Servers">
                <Icon name="lucide:server" />
                <span class="group-data-[collapsible=icon]:hidden">Servers</span>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuButton>
            </NuxtLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NuxtLink to="/templates">
              <SidebarMenuButton tooltip="Templates">
                <Icon name="lucide:layout-template" />
                <span class="group-data-[collapsible=icon]:hidden">Templates</span>
              </SidebarMenuButton>
            </NuxtLink>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarMenu>
    </SidebarContent>

    <SidebarFooter>
      <div class="flex w-full items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="h-auto flex-1 justify-start gap-2 overflow-hidden p-2">
              <Avatar class="size-8">
                <AvatarImage src="https://github.com/radix-vue.png" alt="@radix-vue" />
                <AvatarFallback>DV</AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden text-left">
                <p class="truncate text-sm font-medium">
                  Demo User
                </p>
                <p class="truncate text-xs text-muted-foreground">
                  demo@example.com
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <NuxtLink to="profile">
              <DropdownMenuItem>
                <Icon name="lucide:user" class="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </NuxtLink>
            <DropdownMenuItem>
              <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="lucide:life-buoy" class="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icon name="lucide:log-out" class="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" @click="cycleColorMode">
              <Icon :name="colorModeIcon" class="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p>{{ colorModeTooltip }}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>