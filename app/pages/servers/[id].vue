<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useServerStore, type OnlinePlayer, type FileInfo, type ResourceDataPoint } from '~/stores/server';
import { LineChart } from 'vue-chrts';
import { toast } from 'vue-sonner';
import FileEditorSheet from '~/components/file-editor-sheet.vue';

const route = useRoute();
const serverId = route.params.id as string;
const serverStore = useServerStore();
const config = useRuntimeConfig();

// REFACTORED: Use useAsyncData to fetch server data.
// This handles server-side fetching, loading state, and error handling.
const { data: server, pending: isLoadingCurrent, error } = await useAsyncData(`server-${serverId}`, async () => {
  const fetchedServer = await serverStore.fetchServerById(serverId);
  if (!fetchedServer) {
    // This will show the Nuxt error page, which is better than a client-side redirect.
    throw createError({ statusCode: 404, statusMessage: 'Server Not Found', fatal: true });
  }
  return fetchedServer;
}, {
  // By picking data, we only transfer what's necessary from server to client payload.
  pick: ['id', 'name', 'status', 'ipAddress', 'minecraftVersion', 'javaVersion', 'resources', 'players']
});

useHead({ title: () => `${server.value?.name || 'Manage Server'} - EnderDeploy` });

const { status: wsStatus, data: wsData, send, open, close } = useWebSocket(
  `${config.public.wsBase}/servers/${serverId}`, {
  autoReconnect: true,
  immediate: false, 
}
);

// --- Page & Data Setup ---
const resourceHistory = ref<ResourceDataPoint[]>([]);
const consoleLogs = ref<string[]>([]);
const onlinePlayers = ref<OnlinePlayer[]>([]);
const files = ref<FileInfo[]>([]);
const currentPath = ref('/');
const consoleCommand = ref('');
const isFilesLoading = ref(false);
const kickReason = ref('');
const consoleScrollArea = ref(null); // ADDED: Ref for auto-scrolling
const isFileEditorOpen = ref(false);
const editingFilePath = ref('');

// Client-side specific logic
onMounted(() => {
  if (server.value) {
    open(); // Open WebSocket connection now that we are on the client
    handleTabChange('console');
  }
});

onUnmounted(() => {
  serverStore.currentServer = null;
  close(); 
});

// Watch for WebSocket messages
watch(wsData, (newMessage) => {
  try {
    const message = JSON.parse(newMessage);
    if (message.action === 'log_message') {
      consoleLogs.value.push(message.payload);
      // Keep the console from growing indefinitely
      if (consoleLogs.value.length > 500) consoleLogs.value.shift();
      
      // Auto-scroll to the bottom on new log
      nextTick(() => {
        const scrollEl = (consoleScrollArea.value as any)?.$el?.querySelector('[data-reka-scroll-area-viewport]');
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      });
    }
  } catch (e) { /* Ignore non-JSON messages */ }
});

// --- Action and Helper Functions ---
const fetchFiles = async (path: string) => {
    isFilesLoading.value = true;
    const { data } = await useApiFetch<FileInfo[]>(`/servers/${serverId}/files?path=${encodeURIComponent(path)}`);
    files.value = data.value || [];
    currentPath.value = path;
    isFilesLoading.value = false;
};

const handleTabChange = async (tab: string) => {
  if (!server.value) return;
  if (tab === 'overview' && resourceHistory.value.length === 0) {
    const { data } = await useApiFetch<ResourceDataPoint[]>(`/servers/${serverId}/resources/history`);
    resourceHistory.value = data.value || [];
  }
  if (tab === 'players') {
    const { data } = await useApiFetch<OnlinePlayer[]>(`/servers/${serverId}/players`);
    onlinePlayers.value = data.value || [];
  }
  if (tab === 'files' && files.value.length === 0) {
    await fetchFiles('/');
  }
  if (tab === 'settings' && !server.value.settings) {
    await serverStore.fetchSettings(serverId);
  }
}

const handleFileClick = (file: FileInfo) => {
    if (file.isDir) {
        const newPath = currentPath.value === '/' ? `/${file.name}` : `${currentPath.value}/${file.name}`;
        fetchFiles(newPath);
    } else {
        editingFilePath.value = currentPath.value === '/' ? `/${file.name}` : `${currentPath.value}/${file.name}`;
        isFileEditorOpen.value = true;
    }
}
const navigateUp = () => {
    if (currentPath.value === '/') return;
    const parentPath = currentPath.value.substring(0, currentPath.value.lastIndexOf('/')) || '/';
    fetchFiles(parentPath);
}
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
const storageUsagePercent = computed(() => server.value?.resources.storage || 0);
const getStatusClass = (status: string) => status === "online" ? "server-status-online" : status === "offline" ? "server-status-offline" : "server-status-starting";
const getStatusIcon = (status: string) => status === "online" ? "lucide:power" : status === "offline" ? "lucide:power-off" : "lucide:loader-circle";
const getFileIcon = (isDir: boolean) => isDir ? 'lucide:folder' : 'lucide:file-text';
const handleServerAction = (action: 'start' | 'stop' | 'restart') => {
  toast.info(`Requesting to ${action} the server...`);
  serverStore.performServerAction(serverId, action)
    .then(() => toast.success(`Server ${action} initiated.`))
    .catch(() => toast.error(`Failed to ${action} server.`));
}
const handleKickPlayer = (player: OnlinePlayer) => {
    toast.promise(serverStore.kickPlayer(serverId, player.name, kickReason.value || 'Kicked by administrator.'), {
        loading: `Kicking ${player.name}...`,
        success: () => {
            onlinePlayers.value = onlinePlayers.value.filter(p => p.uuid !== player.uuid);
            kickReason.value = '';
            return `${player.name} has been kicked.`;
        },
        error: (err) => err.data?.message || `Failed to kick ${player.name}.`
    });
}
const handleDeleteServer = () => {
  toast.promise(serverStore.deleteServer(serverId), {
    loading: 'Deleting server...',
    success: () => {
      router.push('/servers');
      return 'Server deleted successfully.';
    },
    error: 'Failed to delete server.'
  });
}
const sendConsoleCommand = () => {
  if (!consoleCommand.value) return;
  const message = JSON.stringify({ action: 'send_command', payload: { command: consoleCommand.value } });
  send(message);
  consoleCommand.value = '';
}
</script>

<template>
  <div v-if="isLoadingCurrent" class="space-y-6">
    <Skeleton class="h-10 w-1/2" />
    <Skeleton class="h-24 w-full" />
    <div class="grid grid-cols-3 gap-4">
      <Skeleton v-for="i in 3" :key="i" class="h-24" />
    </div>
    <Skeleton class="h-96 w-full" />
  </div>
  <div v-else-if="server" class="space-y-6">
    <FileEditorSheet v-model="isFileEditorOpen" :server-id="serverId" :file-path="editingFilePath" />
    <!-- Header and Main Grid -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><NuxtLink to="/">Dashboard</NuxtLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><NuxtLink to="/servers">Servers</NuxtLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{{ server.name }}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img src="https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/grass.png" alt="Server Icon"
              class="w-16 h-16 rounded-lg border-2 border-border" />
            <Badge
              :class="[getStatusClass(server.status), 'absolute -bottom-1 -right-1 border-2 border-background capitalize']">
              <Icon :name="getStatusIcon(server.status)" class="h-3 w-3"
                :class="{ 'animate-spin': server.status === 'starting' || server.status === 'stopping' }" />
              {{ server.status }}
            </Badge>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{{ server.name }}</h1>
            <div class="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <span>{{ server.ipAddress }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto">
          <Button v-if="server.status === 'offline'" size="lg" class="w-full" @click="handleServerAction('start')">
            <Icon name="lucide:play" class="mr-2" /> Start
          </Button>
          <template v-else-if="server.status === 'online'">
            <Button size="lg" variant="destructive" class="w-full" @click="handleServerAction('stop')">
              <Icon name="lucide:square" class="mr-2" /> Stop
            </Button>
            <Button size="lg" variant="outline" class="w-full" @click="handleServerAction('restart')">
              <Icon name="lucide:refresh-cw" class="mr-2" /> Restart
            </Button>
          </template>
           <Button v-else size="lg" class="w-full" disabled>
              <Icon name="lucide:loader-circle" class="mr-2 animate-spin" /> {{ server.status }}
            </Button>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
        <Tabs default-value="console" class="w-full" @update:modelValue="handleTabChange">
            <TabsList class="w-full overflow-x-auto h-auto justify-start">
                <TabsTrigger value="console"><Icon name="lucide:terminal" />Console</TabsTrigger>
                <TabsTrigger value="overview"><Icon name="lucide:line-chart" />Overview</TabsTrigger>
                <TabsTrigger value="players"><Icon name="lucide:users" />Players</TabsTrigger>
                <TabsTrigger value="files"><Icon name="lucide:folder-open" />File Manager</TabsTrigger>
                <TabsTrigger value="backups"><Icon name="lucide:database-backup" />Backups</TabsTrigger>
                <TabsTrigger value="schedules"><Icon name="lucide:timer" />Schedules</TabsTrigger>
                <TabsTrigger value="settings"><Icon name="lucide:sliders-horizontal" />Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="console" class="mt-4">
                <Card class="h-[600px] flex flex-col">
                    <CardContent class="p-0 flex-1 flex flex-col">
                        <ScrollArea ref="consoleScrollArea" class="flex-1 p-4 bg-gray-900/95 dark:bg-black/80 rounded-t-xl">
                            <div class="text-xs font-mono text-white">
                                <p v-for="(log, index) in consoleLogs" :key="index" class="whitespace-pre-wrap break-words leading-snug">{{ log }}</p>
                            </div>
                        </ScrollArea>
                        <div class="p-2 border-t bg-card flex items-center gap-2">
                            <Icon name="lucide:chevron-right" class="text-muted-foreground" />
                            <Input v-model="consoleCommand" @keyup.enter="sendConsoleCommand" placeholder="Type a command..." class="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                            <Button @click="sendConsoleCommand">Send</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="overview" class="mt-4"><Card><CardHeader><CardTitle>Resource History (30 mins)</CardTitle></CardHeader><CardContent><LineChart :data="resourceHistory" :categories="{ cpuUsage: { name: 'CPU', color: 'var(--color-chart-2)' }, ramUsage: { name: 'RAM', color: 'var(--color-chart-3)' }, }" :height="300" y-label="Usage (%)" x-grid-line y-grid-line :y-formatter="(val) => `${val}%`" /></CardContent></Card></TabsContent>
            <TabsContent value="players" class="mt-4"><Card><CardHeader><CardTitle>Online Players</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>UUID</TableHead><TableHead class="text-right">Actions</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="player in onlinePlayers" :key="player.uuid"><TableCell class="font-medium flex items-center gap-2"><img :src="`https://cravatar.eu/helmavatar/${player.uuid || player.name}/32.png`" class="w-6 h-6 rounded" />{{player.name }}</TableCell><TableCell class="font-mono text-muted-foreground">{{ player.uuid }}</TableCell><TableCell class="text-right"><AlertDialog><AlertDialogTrigger as-child><Button variant="outline" size="sm">Kick</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Kick {{ player.name }}?</AlertDialogTitle><AlertDialogDescription>You can provide an optional reason below.</AlertDialogDescription></AlertDialogHeader><Input v-model="kickReason" placeholder="Reason (optional)" /><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction @click="handleKickPlayer(player)">Confirm Kick</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow><TableEmpty v-if="onlinePlayers.length === 0" :colspan="3"><p>No players online</p></TableEmpty></TableBody></Table></CardContent></Card></TabsContent>
            <TabsContent value="files" class="mt-4"><Card><CardHeader><div class="flex items-center justify-between"><div><CardTitle>File Manager</CardTitle><CardDescription class="font-mono text-xs mt-1">{{ currentPath }}</CardDescription></div><div class="flex gap-2"><Button variant="outline" size="sm" @click="navigateUp" :disabled="currentPath === '/'"><Icon name="lucide:arrow-up" class="mr-2 h-4 w-4" />Go Up</Button></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Modified</TableHead><TableHead class="text-right">Actions</TableHead></TableRow></TableHeader><TableBody><TableRow v-if="isFilesLoading"><TableCell colspan="4" class="text-center p-8"><Icon name="lucide:loader-circle" class="h-6 w-6 animate-spin" /></TableCell></TableRow><TableRow v-else v-for="file in files" :key="file.name" @click="handleFileClick(file)" class="cursor-pointer"><TableCell class="font-medium flex items-center gap-2"><Icon :name="getFileIcon(file.isDir)" class="text-muted-foreground" />{{ file.name }}</TableCell><TableCell>{{ file.isDir ? '-' : formatBytes(file.size) }}</TableCell><TableCell>{{ new Date(file.modified).toLocaleString() }}</TableCell><TableCell class="text-right"><Button variant="ghost" size="icon" class="h-8 w-8"><Icon name="lucide:more-horizontal" /></Button></TableCell></TableRow><TableEmpty v-if="!isFilesLoading && files.length === 0" :colspan="4"><p>This directory is empty.</p></TableEmpty></TableBody></Table></CardContent></Card></TabsContent>
            <TabsContent value="backups" class="mt-4"><BackupsTab :server-id="serverId" /></TabsContent>
            <TabsContent value="schedules" class="mt-4"><SchedulesTab :server-id="serverId" /></TabsContent>
            <TabsContent value="settings" class="mt-4"><SettingsTab :server-id="serverId" /></TabsContent>
        </Tabs>
      </div>

      <div class="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Server Details</CardTitle></CardHeader>
          <CardContent class="text-sm space-y-3">
            <div class="flex justify-between"><span class="text-muted-foreground">Version</span><span>{{server.minecraftVersion }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Java</span><span>{{ server.javaVersion}}</span></div>
            <div class="flex flex-col gap-1.5 pt-2">
              <div class="flex justify-between items-center"><label class="text-xs font-medium text-muted-foreground">Storage</label><span>{{ server.resources.storage.toFixed(1) }}%</span></div><Progress :model-value="storageUsagePercent" />
            </div>
          </CardContent>
        </Card>
        <Card class="border-destructive/50 bg-destructive/5">
          <CardHeader><CardTitle class="text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger as-child><Button variant="destructive" class="w-full">Delete Server</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <strong>{{ server.name }}</strong> and all associated data, including backups. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction @click="handleDeleteServer">Confirm Deletion</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>