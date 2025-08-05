<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useScheduleStore, type Schedule } from '~/stores/schedule';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'vue-sonner';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const props = defineProps<{ serverId: string }>();

const scheduleStore = useScheduleStore();
const isSheetOpen = ref(false);
const editingSchedule = ref<Partial<Schedule>>({});

const formSchema = toTypedSchema(
  z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Name is required.'),
    cronExpression: z.string().min(1, 'Cron Expression is required.'), // Add a real cron validator in a real project
    taskType: z.string(),
    isActive: z.boolean(),
    payload: z.object({
      command: z.string().optional(),
      name: z.string().optional(),
    }).optional()
  })
);

onMounted(() => {
    scheduleStore.fetchSchedules(props.serverId);
});

const taskTypes = [
    { value: 'start', label: 'Start Server' },
    { value: 'stop', label: 'Stop Server' },
    { value: 'restart', label: 'Restart Server' },
    { value: 'backup', label: 'Create Backup' },
    { value: 'command', label: 'Run Command' },
];

const openSheet = (schedule: Partial<Schedule> | null) => {
    if (schedule) {
        editingSchedule.value = JSON.parse(JSON.stringify(schedule)); // Deep copy
    } else {
        editingSchedule.value = {
            name: '',
            cronExpression: '0 0 * * *', // Default to midnight
            taskType: 'backup',
            isActive: true,
            payload: { name: 'Scheduled Backup' }
        };
    }
    isSheetOpen.value = true;
};

async function onSubmit(values: any) {
    const scheduleData = {
        ...values,
        serverId: props.serverId
    };
    try {
        await scheduleStore.saveSchedule(scheduleData);
        toast.success("Schedule saved successfully!");
        isSheetOpen.value = false;
    } catch (error: any) {
        toast.error("Failed to save schedule", {
            description: error.data?.message || 'Please check the details and try again.'
        });
    }
}

const handleDelete = async (schedule: Schedule) => {
    try {
        await scheduleStore.deleteSchedule(props.serverId, schedule.id);
        toast.success(`Schedule '${schedule.name}' deleted.`);
    } catch (e) {
        toast.error("Failed to delete schedule.");
    }
}
</script>
<template>
     <Card>
        <CardHeader>
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <CardTitle>Schedules</CardTitle>
                    <CardDescription>Automate tasks like restarts, backups, and commands.</CardDescription>
                </div>
                <Button @click="openSheet(null)">
                    <Icon name="lucide:plus" class="mr-2 h-4 w-4" /> Create Schedule
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Schedule (Cron)</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead class="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     <TableRow v-if="scheduleStore.isLoading">
                        <TableCell colspan="6">
                            <div class="flex justify-center items-center py-8">
                                <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        </TableCell>
                    </TableRow>
                     <TableRow v-for="schedule in scheduleStore.schedules" :key="schedule.id">
                        <TableCell>
                            <Badge :variant="schedule.isActive ? 'default' : 'secondary'">{{ schedule.isActive ? 'Active' : 'Inactive' }}</Badge>
                        </TableCell>
                        <TableCell class="font-medium">{{ schedule.name }}</TableCell>
                        <TableCell class="capitalize">{{ schedule.taskType }}</TableCell>
                        <TableCell class="font-mono">{{ schedule.cronExpression }}</TableCell>
                        <TableCell>{{ schedule.nextRunAt ? formatDistanceToNow(new Date(schedule.nextRunAt)) : 'N/A' }}</TableCell>
                        <TableCell class="text-right">
                           <Button variant="ghost" size="sm" class="mr-2" @click="openSheet(schedule)">Edit</Button>
                           <AlertDialog>
                                <AlertDialogTrigger as-child><Button variant="destructive" size="sm">Delete</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete this schedule?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction @click="handleDelete(schedule)">Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                    <TableEmpty v-if="!scheduleStore.isLoading && scheduleStore.schedules.length === 0" :colspan="6">
                        <div class="text-center py-10">
                          <p class="font-semibold">No Schedules Found</p>
                          <p class="text-sm text-muted-foreground">Automate your server by creating a new schedule.</p>
                        </div>
                    </TableEmpty>
                </TableBody>
            </Table>
        </CardContent>
     </Card>

     <!-- Sheet for Create/Edit -->
     <Sheet :open="isSheetOpen" @update:open="isSheetOpen = $event">
        <SheetContent class="sm:max-w-lg p-0">
             <Form class="flex flex-col h-full" v-if="editingSchedule" :validation-schema="formSchema" :initial-values="editingSchedule" @submit="onSubmit" v-slot="{ values }">
                <SheetHeader class="p-6">
                    <SheetTitle>{{ editingSchedule.id ? 'Edit Schedule' : 'Create Schedule' }}</SheetTitle>
                </SheetHeader>
                <ScrollArea class="flex-grow">
                    <div class="p-6 space-y-4">
                        <FormField name="isActive" v-slot="{ value, setValue }">
                            <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3">
                                <FormLabel>Schedule Active</FormLabel>
                                <FormControl><Switch :checked="value" @update:checked="setValue" /></FormControl>
                            </FormItem>
                        </FormField>
                        <FormField name="name" v-slot="{ componentField }"><FormItem><FormLabel>Name</FormLabel><FormControl><Input v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                        <FormField name="cronExpression" v-slot="{ componentField }"><FormItem><FormLabel>Cron Expression</FormLabel><FormControl><Input v-bind="componentField" /></FormControl><FormDescription>e.g., '0 4 * * *' for 4 AM daily.</FormDescription><FormMessage /></FormItem></FormField>
                        <FormField name="taskType" v-slot="{ componentField }">
                            <FormItem><FormLabel>Task</FormLabel>
                                <Select v-bind="componentField">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem v-for="task in taskTypes" :key="task.value" :value="task.value">{{ task.label }}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField v-if="values.taskType === 'command'" name="payload.command" v-slot="{ componentField }"><FormItem><FormLabel>Command</FormLabel><FormControl><Input placeholder="say Server restarting in 5 minutes!" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                        <FormField v-if="values.taskType === 'backup'" name="payload.name" v-slot="{ componentField }"><FormItem><FormLabel>Backup Name</FormLabel><FormControl><Input placeholder="Daily Backup" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                    </div>
                </ScrollArea>
                <SheetFooter class="p-6 border-t mt-auto bg-background/95">
                    <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
                    <Button type="submit">Save Schedule</Button>
                </SheetFooter>
             </Form>
        </SheetContent>
     </Sheet>
</template>