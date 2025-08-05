<script setup lang="ts">
import { ref } from "vue";

// Define the structure for a server object
type ServerStatus = "online" | "offline" | "starting";

interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  minecraftVersion: string;
  modpack?: {
    name: string;
    version: string;
  };
  javaVersion: string;
  players: {
    current: number;
    max: number;
  };
  resources: {
    cpu: number; // percentage
    ram: number; // percentage
    storage: number; // percentage
  };
  ipAddress: string;
}

// Mock data for demonstration purposes
const servers = ref<Server[]>([
  {
    id: "1",
    name: "EnderCraft Survival",
    status: "online",
    minecraftVersion: "1.21",
    modpack: {
      name: "All the Mods 9",
      version: "1.2.3",
    },
    javaVersion: "17",
    players: { current: 12, max: 50 },
    resources: { cpu: 75, ram: 60, storage: 45 },
    ipAddress: "play.endercraft.net",
  },
  {
    id: "2",
    name: "Vanilla SMP",
    status: "offline",
    minecraftVersion: "1.21",
    javaVersion: "17",
    players: { current: 0, max: 20 },
    resources: { cpu: 0, ram: 0, storage: 20 },
    ipAddress: "vanilla.endercraft.net",
  },
  {
    id: "3",
    name: "Creative World",
    status: "starting",
    minecraftVersion: "1.20.4",
    javaVersion: "17",
    players: { current: 0, max: 100 },
    resources: { cpu: 20, ram: 10, storage: 15 },
    ipAddress: "creative.endercraft.net",
  },
  {
    id: "4",
    name: "Pixelmon Adventures",
    status: "online",
    minecraftVersion: "1.16.5",
    modpack: {
      name: "Pixelmon",
      version: "9.1.5",
    },
    javaVersion: "11",
    players: { current: 34, max: 100 },
    resources: { cpu: 88, ram: 92, storage: 78 },
    ipAddress: "pixel.endercraft.net",
  },
  {
    id: "5",
    name: "Private Test Server",
    status: "offline",
    minecraftVersion: "1.21-snapshot",
    javaVersion: "21",
    players: { current: 0, max: 10 },
    resources: { cpu: 0, ram: 0, storage: 5 },
    ipAddress: "192.168.1.100:25565",
  },
]);

// Helper functions to get dynamic classes and icons based on server status
const getStatusClass = (status: ServerStatus) => {
  if (status === "online") return "server-status-online";
  if (status === "offline") return "server-status-offline";
  return "server-status-starting";
};

const getStatusIcon = (status: ServerStatus) => {
  if (status === "online") return "lucide:power";
  if (status === "offline") return "lucide:power-off";
  return "lucide:loader-circle";
};
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Servers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Your Servers</h1>
            <p class="text-muted-foreground mt-1">Manage, monitor, and deploy your Minecraft servers with ease.</p>
        </div>
        <Button size="lg" class="w-full sm:w-auto">
          <Icon name="lucide:plus" class="mr-2" />
          Create Server
        </Button>
      </div>
    </header>

    <!-- Filters and Search -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search servers by name or IP..." class="pl-10" />
      </div>
      <div class="flex items-center gap-2">
         <Select default-value="status">
            <SelectTrigger class="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="starting">Starting</SelectItem>
            </SelectContent>
        </Select>
        <Button variant="outline" size="icon" class="h-9 w-9">
            <Icon name="lucide:list-filter" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Server Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
      <Card v-for="server in servers" :key="server.id" class="flex flex-col h-full">
        <CardHeader>
          <CardTitle>{{ server.name }}</CardTitle>
          <CardDescription class="flex items-center gap-2 pt-1">
            <Badge :class="getStatusClass(server.status)" class="capitalize">
              <Icon :name="getStatusIcon(server.status)" class="h-3 w-3" :class="{'animate-spin': server.status === 'starting'}" />
              {{ server.status }}
            </Badge>
            <span>•</span>
            <Icon name="lucide:users" class="h-4 w-4" />
            <span>{{ server.players.current }}/{{ server.players.max }}</span>
          </CardDescription>
           <CardAction>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                            <Icon name="lucide:more-vertical" />
                            <span class="sr-only">Server Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <NuxtLink :to="`/servers/${server.id}`">
                          <DropdownMenuItem>
                              <Icon name="lucide:settings-2" class="mr-2 h-4 w-4" />
                              <span>Manage</span>
                          </DropdownMenuItem>
                        </NuxtLink>
                        <DropdownMenuItem>
                            <Icon name="lucide:terminal" class="mr-2 h-4 w-4" />
                            <span>Console</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem v-if="server.status !== 'online'">
                            <Icon name="lucide:play" class="mr-2 h-4 w-4" />
                            <span>Start</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem v-if="server.status === 'online'">
                            <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                            <span>Restart</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="server.status !== 'offline'">
                            <Icon name="lucide:square" class="mr-2 h-4 w-4" />
                            <span>Stop</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                            <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
           </CardAction>
        </CardHeader>
        <CardContent class="flex-grow space-y-6">
          <div class="text-sm text-muted-foreground space-y-3">
            <div class="flex items-center gap-2">
                <Icon name="mdi:minecraft" class="h-5 w-5 text-primary" />
                <span class="font-medium text-foreground">{{ server.minecraftVersion }}</span>
            </div>
            <div v-if="server.modpack" class="flex items-center gap-2">
                <Icon name="lucide:box" class="h-5 w-5 text-primary" />
                <div>
                    <span class="font-medium text-foreground">{{ server.modpack.name }}</span>
                    <span class="text-xs ml-1">(v{{ server.modpack.version }})</span>
                </div>
            </div>
             <div class="flex items-center gap-2">
                <Icon name="mdi:language-java" class="h-5 w-5 text-primary" />
                <span class="font-medium text-foreground">Java {{ server.javaVersion }}</span>
            </div>
          </div>
          <div class="space-y-4 pt-2">
            <div class="grid gap-1.5">
                <div class="flex justify-between items-center">
                    <label class="text-xs font-medium text-muted-foreground">CPU</label>
                    <span class="text-xs font-mono text-muted-foreground">{{server.resources.cpu}}%</span>
                </div>
                <Progress :model-value="server.resources.cpu" />
            </div>
             <div class="grid gap-1.5">
                <div class="flex justify-between items-center">
                    <label class="text-xs font-medium text-muted-foreground">RAM</label>
                    <span class="text-xs font-mono text-muted-foreground">{{server.resources.ram}}%</span>
                </div>
                <Progress :model-value="server.resources.ram" />
            </div>
             <div class="grid gap-1.5">
                 <div class="flex justify-between items-center">
                    <label class="text-xs font-medium text-muted-foreground">Storage</label>
                    <span class="text-xs font-mono text-muted-foreground">{{server.resources.storage}}%</span>
                </div>
                <Progress :model-value="server.resources.storage" />
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pt-4 mt-auto">
            <div class="flex items-center gap-2 w-full">
                <Icon name="lucide:server" class="h-4 w-4 text-muted-foreground" />
                <span class="font-mono text-sm flex-1 truncate" :title="server.ipAddress">{{ server.ipAddress }}</span>
                <Tooltip>
                    <TooltipTrigger as-child>
                         <Button variant="ghost" size="icon" class="h-7 w-7">
                            <Icon name="lucide:copy" class="h-4 w-4" />
                             <span class="sr-only">Copy IP Address</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Copy IP</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </CardFooter>
      </Card>
      <!-- Add New Server Card -->
      <Button variant="outline" class="border-dashed h-full min-h-[300px] flex-col gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200">
          <Icon name="lucide:plus-circle" class="h-10 w-10" />
          <span class="text-base font-semibold">Create New Server</span>
      </Button>
    </div>
  </div>
</template>