<script setup lang="ts">
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
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Dashboard" :is-active="true">
            <Icon name="lucide:layout-dashboard" />
            <span class="group-data-[collapsible=icon]:hidden">Dashboard</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Servers">
            <Icon name="lucide:server" />
            <span class="group-data-[collapsible=icon]:hidden">Servers</span>
            <SidebarMenuBadge>3</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Backups">
            <Icon name="lucide:save" />
            <span class="group-data-[collapsible=icon]:hidden">Backups</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <!-- Management Section -->
        <SidebarGroup class="mt-4">
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Users">
              <Icon name="lucide:users" />
              <span class="group-data-[collapsible=icon]:hidden">Users</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarMenu>
    </SidebarContent>

    <SidebarFooter>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="h-auto w-full justify-start gap-2 p-2">
            <Avatar class="size-8">
              <AvatarImage src="https://github.com/radix-vue.png" alt="@radix-vue" />
              <AvatarFallback>DV</AvatarFallback>
            </Avatar>
            <div class="group-data-[collapsible=icon]:hidden">
              <p class="text-sm font-medium">
                Demo User
              </p>
              <p class="text-xs text-muted-foreground">
                demo@example.com
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Icon name="lucide:user" class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
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
    </SidebarFooter>
  </Sidebar>
</template>