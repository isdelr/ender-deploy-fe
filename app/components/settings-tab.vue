<script setup lang="ts">
import { onMounted } from 'vue';
import { useServerStore } from '~/stores/server';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';

const props = defineProps<{ serverId: string }>();
const serverStore = useServerStore();
const server = computed(() => serverStore.currentServer);

// Zod schema for server settings validation
const settingsSchema = toTypedSchema(
    z.object({
        'motd': z.string().min(1, 'MOTD is required.').max(59, 'MOTD must be 59 characters or less.'),
        'gamemode': z.enum(['survival', 'creative', 'adventure', 'spectator']),
        'difficulty': z.enum(['peaceful', 'easy', 'normal', 'hard']),
        'max-players': z.preprocess(
            (a) => parseInt(z.string().parse(a), 10),
            z.number().positive('Must be a positive number.')
        ),
        'view-distance': z.preprocess(
            (a) => parseInt(z.string().parse(a), 10),
            z.number().min(2, 'Must be at least 2.').max(32, 'Must be 32 or less.')
        ),
        'online-mode': z.boolean(),
        'pvp': z.boolean(),
        'hardcore': z.boolean(),
    })
);

// Fetch settings when the component is mounted
onMounted(() => {
    if (props.serverId && !server.value?.settings) {
        serverStore.fetchSettings(props.serverId);
    }
});

// Handle form submission
async function onSettingsSubmit(values: any) {
    const processedValues = {
        ...values,
        'max-players': String(values['max-players']),
        'view-distance': String(values['view-distance']),
        'online-mode': String(values['online-mode']),
        'pvp': String(values['pvp']),
        'hardcore': String(values['hardcore']),
    }

    toast.promise(serverStore.saveSettings(props.serverId, processedValues), {
        loading: 'Saving settings...',
        success: 'Settings saved successfully! The server will restart to apply them.',
        error: (err) => err.data?.message || 'Failed to save settings.',
    });
}
</script>
<template>
    <div v-if="serverStore.isLoadingSettings">
        <Card>
            <CardHeader>
                <Skeleton class="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton class="h-48 w-full" />
            </CardContent>
        </Card>
    </div>
    <Form v-else-if="server?.settings" :validation-schema="settingsSchema" :initial-values="server.settings"
        @submit="onSettingsSubmit">
        <Card>
            <CardHeader>
                <CardTitle>Server Properties</CardTitle>
                <CardDescription>
                    Manage the core configuration of your server. Changes require a server restart to take effect.
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <FormField name="motd" v-slot="{ componentField }">
                    <FormItem>
                        <FormLabel>Message of the Day (MOTD)</FormLabel>
                        <FormControl><Textarea placeholder="A Minecraft Server" v-bind="componentField" /></FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField name="gamemode" v-slot="{ componentField }">
                        <FormItem>
                            <FormLabel>Gamemode</FormLabel>
                            <Select v-bind="componentField">
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="survival">Survival</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                    <SelectItem value="adventure">Adventure</SelectItem>
                                    <SelectItem value="spectator">Spectator</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField name="difficulty" v-slot="{ componentField }">
                        <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select v-bind="componentField">
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="peaceful">Peaceful</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField name="max-players" v-slot="{ componentField }">
                        <FormItem>
                            <FormLabel>Max Players</FormLabel>
                            <FormControl><Input type="number" v-bind="componentField" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField name="view-distance" v-slot="{ componentField }">
                        <FormItem>
                            <FormLabel>View Distance</FormLabel>
                            <FormControl><Input type="number" v-bind="componentField" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField name="online-mode" v-slot="{ value, setValue }">
                        <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 mt-auto">
                            <FormLabel>Online Mode</FormLabel>
                            <FormControl>
                                <Switch :checked="value" @update:checked="setValue" />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField name="pvp" v-slot="{ value, setValue }">
                        <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 mt-auto">
                            <FormLabel>PvP</FormLabel>
                            <FormControl>
                                <Switch :checked="value" @update:checked="setValue" />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField name="hardcore" v-slot="{ value, setValue }">
                        <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 mt-auto">
                            <FormLabel>Hardcore</FormLabel>
                            <FormControl>
                                <Switch :checked="value" @update:checked="setValue" />
                            </FormControl>
                        </FormItem>
                    </FormField>
                </div>
            </CardContent>
            <CardFooter class="border-t pt-6">
                <Button type="submit">Save & Restart</Button>
            </CardFooter>
        </Card>
    </Form>
</template>