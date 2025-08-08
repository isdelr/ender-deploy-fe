<script setup lang="ts">
import RconConsole from '~/components/rcon-console.vue';
import LogsConsole from '~/components/logs-console.vue';
import SshConsole from '~/components/ssh-console.vue';

// Define the data (histories and logs) this component will receive
defineProps<{
  rconHistory: string[];
  logs: string[];
  terminalHistory: string[];
}>();

// Define the commands this component will emit upwards to the parent page
const emit = defineEmits<{
  (e: 'rcon-command', command: string): void;
  (e: 'terminal-command', command: string): void;
}>();

// Handler functions to pass the emitted events up
const handleRconCommand = (command: string) => {
  emit('rcon-command', command);
}

const handleTerminalCommand = (command: string) => {
  emit('terminal-command', command);
}
</script>

<template>
  <Card>
    <CardContent class="p-0">
      <Tabs default-value="minecraft" class="w-full">
        <!-- The sub-options to switch between consoles -->
        <TabsList class="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="minecraft">
            <Icon name="lucide:terminal" class="mr-2 h-4 w-4" />
            Minecraft
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Icon name="lucide:scroll-text" class="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="terminal">
            <Icon name="lucide:server-cog" class="mr-2 h-4 w-4" />
            Terminal
          </TabsTrigger>
        </TabsList>
        
        <!-- Content for each console type -->
        <TabsContent value="minecraft" class="m-0">
          <RconConsole :history="rconHistory" @command="handleRconCommand" />
        </TabsContent>
        <TabsContent value="logs" class="m-0">
          <LogsConsole :logs="logs" />
        </TabsContent>
        <TabsContent value="terminal" class="m-0">
          <SshConsole :history="terminalHistory" @command="handleTerminalCommand" />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>