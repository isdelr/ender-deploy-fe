<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBackupStore, type Backup } from '~/stores/backup';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'vue-sonner';

const props = defineProps<{ serverId: string }>();

const backupStore = useBackupStore();
const newBackupName = ref('');

onMounted(() => {
    backupStore.fetchBackups(props.serverId);
    backupStore.onBackupUpdate((id) => {
        if (id === props.serverId) {
            toast.info("Backup list might be updated. Refreshing...");
            backupStore.fetchBackups(props.serverId);
        }
    });
});

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const handleCreateBackup = async () => {
    if (!newBackupName.value) {
        toast.error("Backup name cannot be empty.");
        return;
    }
    try {
        await backupStore.createBackup(props.serverId, newBackupName.value);
        toast.success("Backup creation started", {
            description: "The backup is being created in the background and will appear here shortly."
        });
        newBackupName.value = '';
    } catch (error) {
        toast.error("Failed to start backup creation.");
    }
}

const handleRestore = async (backup: Backup) => {
    try {
        await backupStore.restoreBackup(props.serverId, backup.id);
        toast.warning("Server restoration started", {
            description: `The server will now be stopped and restored from '${backup.name}'.`
        });
    } catch (e) {
        toast.error("Failed to start restoration.");
    }
}

const handleDelete = async (backup: Backup) => {
     try {
        await backupStore.deleteBackup(props.serverId, backup.id);
        toast.success(`Backup '${backup.name}' deleted.`);
    } catch (e) {
        toast.error("Failed to delete backup.");
    }
}
</script>
<template>
    <Card>
        <CardHeader>
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <CardTitle>Backups</CardTitle>
                    <CardDescription>Create, restore, and manage server backups.</CardDescription>
                </div>
                 <div class="flex gap-2 w-full sm:w-auto">
                    <Input v-model="newBackupName" placeholder="New backup name..." class="flex-1" />
                    <Button @click="handleCreateBackup">
                        <Icon name="lucide:plus" class="mr-2 h-4 w-4" /> Create
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead class="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="backupStore.isLoading">
                        <TableCell colspan="4">
                            <div class="flex justify-center items-center py-8">
                                <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        </TableCell>
                    </TableRow>
                    <TableRow v-for="backup in backupStore.backups" :key="backup.id">
                        <TableCell class="font-medium">{{ backup.name }}</TableCell>
                        <TableCell>{{ formatBytes(backup.size) }}</TableCell>
                        <TableCell>{{ formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true }) }}</TableCell>
                        <TableCell class="text-right">
                            <AlertDialog>
                                <AlertDialogTrigger as-child>
                                    <Button variant="outline" size="sm" class="mr-2">Restore</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Restore from backup?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will stop your server, replace all current files with the backup files from '{{ backup.name }}', and then restart it. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction @click="handleRestore(backup)">Confirm Restore</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             <AlertDialog>
                                <AlertDialogTrigger as-child>
                                    <Button variant="destructive" size="sm">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is permanent and cannot be undone. The backup file '{{ backup.name }}' will be deleted from storage.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction @click="handleDelete(backup)">Confirm Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                    <TableEmpty v-if="!backupStore.isLoading && backupStore.backups.length === 0" :colspan="4">
                        <div class="text-center py-10">
                          <p class="font-semibold">No Backups Found</p>
                          <p class="text-sm text-muted-foreground">Create your first backup to get started.</p>
                        </div>
                    </TableEmpty>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
</template>