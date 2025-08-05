<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { LineChart } from 'vue-chrts';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

// --- Page & Mock Data Setup ---
useHead({
  title: 'Manage Server - EnderDeploy',
});

const route = useRoute();
const serverId = route.params.id;

// Define types
type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping';

// Zod schema for server settings
const settingsSchema = toTypedSchema(
  z.object({
    serverName: z.string().min(3, "Server name must be at least 3 characters."),
    motd: z.string().max(59, "MOTD has a maximum length of 59 characters."),
    gameMode: z.string(),
    difficulty: z.string(),
    maxPlayers: z.number().int().positive(),
    onlineMode: z.boolean(),
    pvp: z.boolean(),
    hardcore: z.boolean(),
    viewDistance: z.array(z.number()),
  })
);


// Mock server data - in a real app, this would be fetched based on serverId
const server = ref({
  id: serverId,
  name: 'EnderCraft Survival',
  status: 'online' as ServerStatus,
  ipAddress: 'play.endercraft.net',
  port: 25565,
  players: { current: 12, max: 50 },
  version: 'Paper 1.21',
  javaVersion: '17',
  uptime: '2d 15h 32m',
  motd: 'The ultimate survival experience!',
  node: 'US-East-01',
  resources: {
    cpu: { current: 75, limit: 400 }, // current usage %, limit in % of a core
    ram: { current: 6144, limit: 8192 }, // in MB
    storage: { current: 15360, limit: 51200 }, // in MB
  },
  settings: {
    serverName: 'EnderCraft Survival',
    motd: 'The ultimate survival experience!',
    gameMode: 'survival',
    difficulty: 'hard',
    maxPlayers: 50,
    onlineMode: true,
    pvp: true,
    hardcore: false,
    viewDistance: [10],
  }
});

const resourceHistory = ref(
  Array.from({ length: 30 }, (_, i) => ({
    time: new Date(Date.now() - (29 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: Math.floor(Math.random() * (80 - 40 + 1) + 40),
    ram: Math.floor(Math.random() * (70 - 50 + 1) + 50),
  }))
);

const consoleLogs = ref([
  { level: 'INFO', time: '14:32:01', message: '[Server] Server thread/INFO: Done (10.456s)! For help, type "help"' },
  { level: 'INFO', time: '14:32:15', message: '[Server] User Authenticator #1/INFO: UUID of player Steve is 069a79f4-44e9-4726-a5be-fca90e38aaf5' },
  { level: 'INFO', time: '14:32:16', message: '[Server] Server thread/INFO: Steve[/127.0.0.1:54321] logged in with entity id 123 at ([world] 10.5, 64.0, -20.5)' },
  { level: 'WARN', time: '14:33:02', message: '[Server] Server thread/WARN: Steve moved wrongly!' },
  { level: 'INFO', time: '14:33:45', message: '[Server] Server thread/INFO: <Steve> Hello world!' },
  { level: 'INFO', time: '14:34:05', message: '[Server] User Authenticator #2/INFO: UUID of player Alex is 61699b2e-d327-4a01-9f1e-0ea8c3f06bc6' },
  { level: 'INFO', time: '14:34:06', message: '[Server] Server thread/INFO: Alex[/127.0.0.1:54322] logged in with entity id 124 at ([world] 12.5, 64.0, -18.5)' },
  { level: 'ERROR', time: '14:35:10', message: '[Server] Server thread/ERROR: Failed to save player data for Herobrine' },
]);

const onlinePlayers = ref([
  { name: 'Steve', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', ping: 24 },
  { name: 'Alex', uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6', ping: 32 },
  { name: 'CreeperLover69', uuid: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6', ping: 56 },
]);

const files = ref([
  { name: 'plugins', type: 'folder', size: '25.6 MB', modified: '2 days ago' },
  { name: 'world', type: 'folder', size: '1.2 GB', modified: '5 minutes ago' },
  { name: 'server.properties', type: 'file', size: '2.1 KB', modified: '1 hour ago' },
  { name: 'paper.yml', type: 'file', size: '8.7 KB', modified: '1 hour ago' },
  { name: 'spigot.yml', type: 'file', size: '4.3 KB', modified: '1 hour ago' },
  { name: 'banned-players.json', type: 'file', size: '0.1 KB', modified: '1 week ago' },
]);

const gamemodes = ['survival', 'creative', 'adventure', 'spectator'];
const difficulties = ['peaceful', 'easy', 'normal', 'hard'];

// --- Computed Properties ---
const cpuUsagePercent = computed(() => server.value.resources.cpu.current);
const ramUsagePercent = computed(() => (server.value.resources.ram.current / server.value.resources.ram.limit) * 100);
const storageUsagePercent = computed(() => (server.value.resources.storage.current / server.value.resources.storage.limit) * 100);

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

const getLogLevelClass = (level: string) => {
  if (level === 'WARN') return 'text-yellow-400';
  if (level === 'ERROR' || level === 'FATAL') return 'text-red-500';
  if (level === 'DEBUG') return 'text-blue-400';
  return 'text-gray-400';
};

const getFileIcon = (type: string) => {
  if (type === 'folder') return 'lucide:folder';
  return 'lucide:file-text';
};

// --- Form Handlers ---
function onSettingsSubmit(values: any) {
  console.log("Saving settings:", values);
  // API call would go here
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <NuxtLink to="/">Dashboard</NuxtLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <NuxtLink to="/servers">Servers</NuxtLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ server.name }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img src="https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/grass.png" alt="Server Icon" class="w-16 h-16 rounded-lg border-2 border-border" />
            <Badge :class="[getStatusClass(server.status), 'absolute -bottom-1 -right-1 border-2 border-background capitalize']">
              <Icon :name="getStatusIcon(server.status)" class="h-3 w-3" :class="{'animate-spin': server.status === 'starting' || server.status === 'stopping'}" />
              {{ server.status }}
            </Badge>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{{ server.name }}</h1>
            <div class="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <span>{{ server.ipAddress }}:{{ server.port }}</span>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6">
                    <Icon name="lucide:copy" class="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy IP Address</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto">
          <Button v-if="server.status === 'offline'" size="lg" class="w-full">
            <Icon name="lucide:play" class="mr-2" /> Start
          </Button>
          <template v-if="server.status === 'online'">
            <Button size="lg" variant="destructive" class="w-full">
              <Icon name="lucide:square" class="mr-2" /> Stop
            </Button>
            <Button size="lg" variant="outline" class="w-full">
              <Icon name="lucide:refresh-cw" class="mr-2" /> Restart
            </Button>
          </template>
           <DropdownMenu>
              <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="lg" class="w-full md:w-auto">
                      <Icon name="lucide:more-horizontal" class="mr-2" /> More
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-56">
                  <DropdownMenuItem>
                    <Icon name="lucide:shield-plus" class="mr-2 h-4 w-4" />
                    <span>Create Backup</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem>
                    <Icon name="lucide:wrench" class="mr-2 h-4 w-4" />
                    <span>Reinstall Server</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                      <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                      <span>Delete Server</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    <!-- Main Grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Main Content Column -->
      <div class="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">

        <!-- Live Resource Usage -->
        <div class="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">CPU Usage</CardTitle>
              <Icon name="lucide:cpu" class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ cpuUsagePercent.toFixed(1) }}%</div>
              <p class="text-xs text-muted-foreground">of {{ server.resources.cpu.limit }}% limit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">RAM Usage</CardTitle>
              <Icon name="lucide:memory-stick" class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ (server.resources.ram.current / 1024).toFixed(1) }} GB</div>
              <p class="text-xs text-muted-foreground">of {{ (server.resources.ram.limit / 1024).toFixed(1) }} GB limit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Players Online</CardTitle>
              <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ server.players.current }} / {{ server.players.max }}</div>
              <p class="text-xs text-muted-foreground">currently connected</p>
            </CardContent>
          </Card>
        </div>

        <!-- Management Tabs -->
        <Tabs default-value="console" class="w-full">
            <TabsList>
                <TabsTrigger value="console"><Icon name="lucide:terminal" />Console</TabsTrigger>
                <TabsTrigger value="overview"><Icon name="lucide:line-chart" />Overview</TabsTrigger>
                <TabsTrigger value="players"><Icon name="lucide:users" />Players</TabsTrigger>
                <TabsTrigger value="files"><Icon name="lucide:folder-open" />File Manager</TabsTrigger>
                <TabsTrigger value="settings"><Icon name="lucide:sliders-horizontal" />Settings</TabsTrigger>
            </TabsList>

            <!-- Console Tab -->
            <TabsContent value="console" class="mt-4">
              <Card class="h-[600px] flex flex-col">
                <CardContent class="p-0 flex-1 flex flex-col">
                  <ScrollArea class="flex-1 p-4 bg-gray-900/95 dark:bg-black/80 rounded-t-xl">
                    <pre class="text-xs font-mono text-white whitespace-pre-wrap"><template v-for="(log, index) in consoleLogs" :key="index"><span :class="getLogLevelClass(log.level)">[{{ log.time }} {{ log.level }}]:</span> {{ log.message }}{{'\n'}}</template></pre>
                  </ScrollArea>
                  <div class="p-2 border-t bg-card flex items-center gap-2">
                    <Icon name="lucide:chevron-right" class="text-muted-foreground"/>
                    <Input placeholder="Type a command..." class="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                    <Button>Send</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

             <!-- Overview Tab -->
            <TabsContent value="overview" class="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Resource History (Last 30 Minutes)</CardTitle>
                        <CardDescription>Live view of CPU and Memory consumption.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart :data="resourceHistory" :categories="{
                          cpu: { name: 'CPU Usage', color: 'var(--color-chart-2)' },
                          ram: { name: 'RAM Usage', color: 'var(--color-chart-3)' },
                        }" :height="300" y-label="Usage (%)" x-grid-line y-grid-line
                        :x-formatter="(tick: any, i: any) => i % 5 === 0 ? resourceHistory[i].time : ''"
                        :y-formatter="(val) => `${val}%`" />
                    </CardContent>
                </Card>
            </TabsContent>

            <!-- Players Tab -->
            <TabsContent value="players" class="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Online Players</CardTitle>
                </CardHeader>
                <CardContent>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>UUID</TableHead>
                        <TableHead>Ping</TableHead>
                        <TableHead class="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="player in onlinePlayers" :key="player.uuid">
                        <TableCell class="font-medium flex items-center gap-2">
                           <img :src="`https://cravatar.eu/helmavatar/${player.uuid}/32.png`" class="w-6 h-6 rounded" />
                           {{ player.name }}
                        </TableCell>
                        <TableCell class="font-mono text-muted-foreground">{{ player.uuid }}</TableCell>
                        <TableCell>{{ player.ping }}ms</TableCell>
                        <TableCell class="text-right">
                          <Button variant="outline" size="sm">Kick</Button>
                        </TableCell>
                      </TableRow>
                       <TableEmpty v-if="onlinePlayers.length === 0" :colspan="4">
                        <div class="text-center">
                          <p class="font-semibold">No players online</p>
                          <p class="text-sm text-muted-foreground">Waiting for adventurers to join the realm.</p>
                        </div>
                      </TableEmpty>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

             <!-- File Manager Tab -->
            <TabsContent value="files" class="mt-4">
               <Card>
                <CardHeader>
                  <CardTitle>File Manager</CardTitle>
                  <CardDescription>Current path: <code>/</code></CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead class="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="file in files" :key="file.name">
                        <TableCell class="font-medium flex items-center gap-2">
                          <Icon :name="getFileIcon(file.type)" class="text-muted-foreground" />
                           {{ file.name }}
                        </TableCell>
                        <TableCell>{{ file.size }}</TableCell>
                        <TableCell>{{ file.modified }}</TableCell>
                        <TableCell class="text-right">
                          <Button variant="ghost" size="icon" class="h-8 w-8">
                            <Icon name="lucide:more-horizontal" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- Settings Tab -->
            <TabsContent value="settings" class="mt-4">
              <Form :validation-schema="settingsSchema" :initial-values="server.settings" @submit="onSettingsSubmit">
                 <Card>
                  <CardHeader>
                    <CardTitle>Server Settings</CardTitle>
                    <CardDescription>Modify your server's core configuration. A restart is required for most changes to take effect.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" class="w-full" default-value="['general', 'world']">
                      <AccordionItem value="general">
                        <AccordionTrigger>General Settings</AccordionTrigger>
                        <AccordionContent class="pt-4 space-y-4">
                           <FormField name="serverName" v-slot="{ componentField }">
                              <FormItem>
                                <FormLabel>Server Name</FormLabel>
                                <FormControl><Input v-bind="componentField" /></FormControl>
                                <FormDescription>The name displayed in the server list and panel.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            </FormField>
                            <FormField name="motd" v-slot="{ componentField }">
                              <FormItem>
                                <FormLabel>Message of the Day (MOTD)</FormLabel>
                                <FormControl><Textarea v-bind="componentField" /></FormControl>
                                <FormDescription>The message displayed in the Minecraft server list.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            </FormField>
                             <FormField name="maxPlayers" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Max Players</FormLabel>
                                    <FormControl><Input type="number" v-bind="componentField" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                        </AccordionContent>
                      </AccordionItem>
                       <AccordionItem value="world">
                          <AccordionTrigger>World & Gameplay</AccordionTrigger>
                          <AccordionContent class="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField name="gameMode" v-slot="{ componentField }">
                                  <FormItem>
                                      <FormLabel>Game Mode</FormLabel>
                                      <Select v-bind="componentField">
                                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                          <SelectContent>
                                              <SelectItem v-for="mode in gamemodes" :key="mode" :value="mode" class="capitalize">{{ mode }}</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              </FormField>
                              <FormField name="difficulty" v-slot="{ componentField }">
                                  <FormItem>
                                      <FormLabel>Difficulty</FormLabel>
                                      <Select v-bind="componentField">
                                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                          <SelectContent>
                                              <SelectItem v-for="diff in difficulties" :key="diff" :value="diff" class="capitalize">{{ diff }}</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              </FormField>
                              <FormField name="onlineMode" v-slot="{ value, setValue }">
                                  <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-full">
                                      <div class="space-y-0.5">
                                          <FormLabel>Online Mode</FormLabel>
                                          <FormDescription>Verify players with Mojang servers.</FormDescription>
                                      </div>
                                      <FormControl><Switch :checked="value" @update:checked="setValue" /></FormControl>
                                  </FormItem>
                              </FormField>
                              <FormField name="pvp" v-slot="{ value, setValue }">
                                  <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div class="space-y-0.5"><FormLabel>Enable PvP</FormLabel></div>
                                      <FormControl><Switch :checked="value" @update:checked="setValue" /></FormControl>
                                  </FormItem>
                              </FormField>
                              <FormField name="hardcore" v-slot="{ value, setValue }">
                                  <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div class="space-y-0.5"><FormLabel>Hardcore</FormLabel></div>
                                      <FormControl><Switch :checked="value" @update:checked="setValue" /></FormControl>
                                  </FormItem>
                              </FormField>
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="performance">
                          <AccordionTrigger>Performance</AccordionTrigger>
                          <AccordionContent class="pt-4 space-y-6">
                              <FormField name="viewDistance" v-slot="{ componentField }">
                                  <FormItem>
                                      <FormLabel>View Distance ({{ componentField.modelValue?.[0] || 10 }})</FormLabel>
                                      <FormControl>
                                          <Slider v-bind="componentField" :max="32" :min="2" :step="1" />
                                      </FormControl>
                                  </FormItem>
                              </FormField>
                          </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter class="border-t pt-6">
                    <Button type="submit">Save Settings</Button>
                  </CardFooter>
                </Card>
              </Form>
            </TabsContent>
        </Tabs>
      </div>

       <!-- Side Column -->
      <div class="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Server Details</CardTitle></CardHeader>
          <CardContent class="text-sm space-y-3">
             <div class="flex justify-between">
              <span class="text-muted-foreground">Uptime</span>
              <span>{{ server.uptime }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Server Version</span>
              <span>{{ server.version }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-muted-foreground">Java Version</span>
              <span>{{ server.javaVersion }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-muted-foreground">Node</span>
              <span>{{ server.node }}</span>
            </div>
             <div class="flex flex-col gap-1.5 pt-2">
                <div class="flex justify-between items-center">
                    <label class="text-xs font-medium text-muted-foreground">Storage</label>
                    <span class="text-xs font-mono text-muted-foreground">{{ (server.resources.storage.current / 1024).toFixed(1) }} / {{ (server.resources.storage.limit / 1024).toFixed(1) }} GB</span>
                </div>
                <Progress :model-value="storageUsagePercent" />
            </div>
          </CardContent>
        </Card>
         <Card class="border-destructive/50 bg-destructive/5">
            <CardHeader>
                <CardTitle class="text-destructive">Danger Zone</CardTitle>
                 <CardDescription class="text-destructive/90">These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
               <AlertDialog>
                    <AlertDialogTrigger as-child>
                        <Button variant="destructive" class="w-full">Delete Server</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete <strong>{{ server.name }}</strong> and all of its data, including worlds, plugins, and backups. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Confirm Deletion</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>