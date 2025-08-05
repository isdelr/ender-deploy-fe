<script setup lang="ts">
import { ref } from 'vue';
import { AreaChart, LineChart, DonutChart } from 'vue-chrts';

// --- Mock Data & Types ---

type ServerStatus = 'online' | 'offline' | 'starting';

interface ActiveServer {
  id: string;
  name: string;
  players: { current: number; max: number };
  cpu: number;
  ram: number;
}

interface ActivityEvent {
  id: number;
  icon: string;
  color: string;
  message: string;
  timestamp: string;
}

interface SystemAlert {
  id: number;
  title: string;
  description: string;
}

// Key Metrics
const totalServers = ref({ total: 16, online: 12 });
const totalPlayers = ref({ current: 178, max: 550 });
const systemHealth = ref(98.5); // Percentage

// Chart Data
const playerHistoryData = ref(
  Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    players: Math.floor(Math.random() * (150 - 40 + 1) + 40) + (i > 8 && i < 22 ? i * 5 : Math.abs(i - 12) * 2),
  }))
);

const resourceUsageData = ref(
  Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.floor(Math.random() * (75 - 30 + 1) + 30) + (i > 16 && i < 21 ? 20 : 0),
    ram: Math.floor(Math.random() * (85 - 50 + 1) + 50) - (i > 8 && i < 14 ? 15 : 0),
  }))
);

const serverStatus = ref({
  online: 12,
  offline: 3,
  starting: 1,
});

const donutChartData = ref(Object.values(serverStatus.value));
const donutChartLabels = ref([
  { name: 'Online', color: 'var(--color-success)' },
  { name: 'Offline', color: 'var(--color-destructive)' },
  { name: 'Starting', color: 'var(--color-warning)' },
]);


// Active Servers Table
const activeServers = ref<ActiveServer[]>([
  { id: '1', name: 'EnderCraft Survival', players: { current: 48, max: 100 }, cpu: 82, ram: 75 },
  { id: '2', name: 'Pixelmon Adventures', players: { current: 34, max: 100 }, cpu: 88, ram: 92 },
  { id: '3', name: 'Creative World', players: { current: 22, max: 50 }, cpu: 45, ram: 55 },
  { id: '4', name: 'Vanilla SMP', players: { current: 18, max: 20 }, cpu: 65, ram: 50 },
  { id: '5', name: 'Skyblock Enhanced', players: { current: 56, max: 200 }, cpu: 91, ram: 85 },
]);

// Activity Feed
const activityFeed = ref<ActivityEvent[]>([
  { id: 1, icon: 'lucide:power', color: 'text-success', message: "Server 'EnderCraft Survival' has started successfully.", timestamp: '2 minutes ago' },
  { id: 2, icon: 'lucide:user-plus', color: 'text-blue-500', message: "Player 'Notch' joined 'Vanilla SMP'.", timestamp: '5 minutes ago' },
  { id: 3, icon: 'lucide:shield-alert', color: 'text-warning', message: "High CPU usage detected on 'Pixelmon Adventures'.", timestamp: '10 minutes ago' },
  { id: 4, icon: 'lucide:download-cloud', color: 'text-primary', message: "Backup for 'Creative World' completed.", timestamp: '1 hour ago' },
  { id: 5, icon: 'lucide:power-off', color: 'text-destructive', message: "Server 'Test Server' was stopped.", timestamp: '3 hours ago' },
]);

// System Alerts
const systemAlerts = ref<SystemAlert[]>([
  { id: 1, title: 'Critical CPU Load on Node #3', description: 'The main CPU has been over 95% for the last 15 minutes. Performance may be degraded.' },
  { id: 2, title: 'Disk Space Alert', description: 'Global storage is at 92% capacity. Please clear backups or upgrade storage.' },
]);

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground mt-1">Welcome back, here's a comprehensive overview of your servers.</p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Select default-value="24h">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button class="w-full sm:w-auto">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Create Server
        </Button>
      </div>
    </header>

    <!-- Key Metric Cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Total Servers</CardTitle>
            <Icon name="lucide:server" class="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ totalServers.total }}</p>
          <p class="text-sm text-muted-foreground">{{ totalServers.online }} servers online</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Players Online</CardTitle>
            <Icon name="lucide:users" class="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ totalPlayers.current }} / {{ totalPlayers.max }}</p>
          <p class="text-sm text-muted-foreground">Across all online servers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            <Icon name="lucide:activity" class="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold text-success">{{ systemHealth }}%</p>
          <p class="text-sm text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    </div>

    <!-- Main Grid: Charts, Servers, Logs -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Left Column -->
      <div class="col-span-12 lg:col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Player History (24h)</CardTitle>
            <CardDescription>Total players online across all servers.</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart :data="playerHistoryData"
              :categories="{ players: { name: 'Players', color: 'var(--color-primary)' } }" :height="300"
              y-label="Players" x-grid-line y-grid-line
              :x-formatter="(tick: any, i: any) => i % 2 === 0 ? playerHistoryData[i].time : ''" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Global Resource Usage (24h)</CardTitle>
            <CardDescription>Aggregated CPU and RAM usage across all nodes.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart :data="resourceUsageData" :categories="{
              cpu: { name: 'CPU Usage', color: 'var(--color-chart-2)' },
              ram: { name: 'RAM Usage', color: 'var(--color-chart-3)' },
            }" :height="300" y-label="Usage (%)" x-grid-line y-grid-line
              :x-formatter="(tick: any, i: any) => i % 2 === 0 ? resourceUsageData[i].time : ''"
              :y-formatter="(val) => `${val}%`" />
          </CardContent>
        </Card>
      </div>

      <!-- Right Column -->
      <div class="col-span-12 lg:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
          </CardHeader>
          <CardContent class="flex justify-center items-center">
            <DonutChart :data="donutChartData" :labels="donutChartLabels" :height="250" :radius="100" :arc-width="20">
              <div class="text-center">
                <p class="text-3xl font-bold">{{ totalServers.total }}</p>
                <p class="text-sm text-muted-foreground">Total Servers</p>
              </div>
            </DonutChart>
          </CardContent>
        </Card>

        <Card class="flex flex-col h-fit">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <Alert v-for="alert in systemAlerts" :key="alert.id" variant="destructive">
              <Icon name="lucide:siren" />
              <AlertTitle>{{ alert.title }}</AlertTitle>
              <AlertDescription>{{ alert.description }}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card class="flex flex-col h-fit">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="event in activityFeed" :key="event.id" class="flex items-start gap-3">
              <div class="bg-muted rounded-full p-2">
                <Icon :name="event.icon" class="h-4 w-4" :class="event.color" />
              </div>
              <div class="flex-1">
                <p class="text-sm">{{ event.message }}</p>
                <p class="text-xs text-muted-foreground">{{ event.timestamp }}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" class="w-full">View All Logs</Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Full-Width Bottom Section -->
      <div class="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle>Top Active Servers</CardTitle>
            <CardDescription>Your most populated servers right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server Name</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead class="w-[200px]">CPU Usage</TableHead>
                  <TableHead class="w-[200px]">RAM Usage</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="server in activeServers" :key="server.id">
                  <TableCell class="font-medium">{{ server.name }}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{{ server.players.current }} / {{ server.players.max }}</Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Progress :model-value="server.cpu" class="w-24" />
                      <span class="text-xs text-muted-foreground font-mono">{{ server.cpu }}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Progress :model-value="server.ram" class="w-24" />
                      <span class="text-xs text-muted-foreground font-mono">{{ server.ram }}%</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>