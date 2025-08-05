<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AreaChart, LineChart, DonutChart } from 'vue-chrts';
import { useDashboardStore } from '~/stores/dashboard';

const dashboardStore = useDashboardStore();

onMounted(() => {
  dashboardStore.fetchDashboardData();
});

// --- Computed Properties for Chart Data ---

const playerHistoryData = computed(() => 
  dashboardStore.stats?.playerHistory.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
    players: p.playersCurrent,
  })) || []
);

const resourceUsageData = computed(() => 
  dashboardStore.stats?.resourceHistory.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
    cpu: p.cpuUsage,
    ram: p.ramUsage,
  })) || []
);

const serverStatusDist = computed(() => dashboardStore.stats?.serverStatusDist || {});
const donutChartData = computed(() => [
    serverStatusDist.value['online'] || 0,
    serverStatusDist.value['offline'] || 0,
    serverStatusDist.value['starting'] || 0,
    serverStatusDist.value['stopping'] || 0,
]);
const donutChartLabels = ref([
  { name: 'Online', color: 'var(--color-success)' },
  { name: 'Offline', color: 'var(--color-destructive)' },
  { name: 'Starting', color: 'var(--color-warning)' },
  { name: 'Stopping', color: 'var(--color-warning)' },
]);

// --- Computed Properties for Activity Feed ---
const getEventIcon = (type: string) => {
    if (type.includes('start')) return 'lucide:power';
    if (type.includes('stop')) return 'lucide:power-off';
    if (type.includes('backup')) return 'lucide:download-cloud';
    if (type.includes('alert')) return 'lucide:shield-alert';
    return 'lucide:info';
}

const getEventColor = (level: string) => {
    if (level === 'warn') return 'text-warning';
    if (level === 'error') return 'text-destructive';
    return 'text-primary';
}

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground mt-1">A comprehensive overview of your server infrastructure.</p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <NuxtLink to="/servers/create">
            <Button class="w-full sm:w-auto">
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Create Server
            </Button>
        </NuxtLink>
      </div>
    </header>

    <!-- Loading Skeletons -->
    <div v-if="dashboardStore.isLoading">
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Skeleton v-for="i in 3" :key="i" class="h-32" />
        </div>
        <div class="grid grid-cols-12 gap-6 mt-6">
            <div class="col-span-12 lg:col-span-8 space-y-6">
                <Skeleton class="h-80" />
                <Skeleton class="h-80" />
            </div>
             <div class="col-span-12 lg:col-span-4 space-y-6">
                <Skeleton class="h-96" />
             </div>
        </div>
    </div>

    <!-- Key Metric Cards -->
    <div v-else-if="dashboardStore.stats" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Total Servers</CardTitle>
            <Icon name="lucide:server" class="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ dashboardStore.stats.totalServers }}</p>
          <p class="text-sm text-muted-foreground">{{ dashboardStore.stats.onlineServers }} servers online</p>
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
          <p class="text-3xl font-bold">{{ dashboardStore.stats.totalPlayers }} / {{ dashboardStore.stats.maxPlayers }}</p>
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
          <p class="text-3xl font-bold text-success">{{ dashboardStore.stats.systemHealth }}%</p>
          <p class="text-sm text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    </div>

    <!-- Main Grid: Charts, Servers, Logs -->
    <div v-if="!dashboardStore.isLoading && dashboardStore.stats" class="grid grid-cols-12 gap-6">
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
                <p class="text-3xl font-bold">{{ dashboardStore.stats.totalServers }}</p>
                <p class="text-sm text-muted-foreground">Total Servers</p>
              </div>
            </DonutChart>
          </CardContent>
        </Card>

        <Card class="flex flex-col h-fit">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="event in dashboardStore.recentEvents" :key="event.id" class="flex items-start gap-3">
              <div class="bg-muted rounded-full p-2">
                <Icon :name="getEventIcon(event.type)" class="h-4 w-4" :class="getEventColor(event.level)" />
              </div>
              <div class="flex-1">
                <p class="text-sm">{{ event.message }}</p>
                <p class="text-xs text-muted-foreground">{{ new Date(event.createdAt).toLocaleString() }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>