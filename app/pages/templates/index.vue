<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useTemplateStore } from '~/stores/template';
import { toast } from 'vue-sonner';

// The definePageMeta block has been removed.
useHead({ title: 'Templates - EnderDeploy' });

const templateStore = useTemplateStore();

// REFACTORED: Fetch templates on initial load for SSR.
const { pending: isLoading, error } = await useAsyncData('templates-list', () =>
    templateStore.fetchTemplates()
);

const formSchema = toTypedSchema(
    z.object({
        id: z.string().optional(),
        name: z.string().min(3, 'Name must be at least 3 characters.'),
        description: z.string().optional(),
        installType: z.enum(['standard', 'modpack']),
        // Standard
        serverType: z.string().optional(),
        minecraftVersion: z.string().optional(),
        // Modpack
        modpackType: z.string().optional(),
        modpackURL: z.string().optional(),
        // Common
        javaVersion: z.string(),
        minMemoryMB: z.number().positive(),
        maxMemoryMB: z.number().positive(),
        jvmArgs: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        properties: z.record(z.string()).optional(),
    }).superRefine((data, ctx) => {
        if (data.installType === 'standard') {
            if (!data.serverType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Server Type is required.', path: ['serverType'] });
            if (!data.minecraftVersion) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minecraft Version is required.', path: ['minecraftVersion'] });
        } else if (data.installType === 'modpack') {
            if (!data.modpackType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provider is required.', path: ['modpackType'] });
            if (!data.modpackURL) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Modpack URL is required.', path: ['modpackURL'] });
        }
    })
);

// Explicitly type Template for clarity
type Template = Partial<z.infer<typeof formSchema>> & { id: string; name: string };

const isSheetOpen = ref(false);
const editingTemplate = ref<Partial<Template>>({});
const serverTypes = ['Vanilla', 'Paper', 'Forge', 'Fabric'];
const minecraftVersions = ['1.21', '1.20.4', '1.20.1', '1.19.2', '1.18.2', '1.16.5'];
const javaVersions = ['8', '11', '17', '21'];

const createNewTemplate = () => {
    editingTemplate.value = {
        name: '', description: '', tags: [],
        installType: 'standard',
        serverType: 'Paper', minecraftVersion: minecraftVersions[0],
        modpackType: 'CURSEFORGE', modpackURL: '',
        javaVersion: '17',
        minMemoryMB: 1024, maxMemoryMB: 4096,
        jvmArgs: [],
        properties: { 'gamemode': 'survival', 'difficulty': 'easy', 'hardcore': 'false', 'max-players': '20', 'pvp': 'true', 'online-mode': 'true', 'view-distance': '10', 'simulation-distance': '10' },
    };
    isSheetOpen.value = true;
};
const editTemplate = (template: Template) => {
    const templateCopy = JSON.parse(JSON.stringify(template));
    // Determine installType for the form based on whether modpack fields exist
    templateCopy.installType = (templateCopy.modpackType && templateCopy.modpackURL) ? 'modpack' : 'standard';
    editingTemplate.value = templateCopy;
    isSheetOpen.value = true;
};
async function onSubmit(values: any) {
    // Clean up data before sending to backend
    if (values.installType === 'standard') {
        values.modpackType = null;
        values.modpackURL = null;
    } else {
        values.serverType = null;
        values.minecraftVersion = null;
    }
    try {
        await templateStore.saveTemplate(values);
        toast.success(`Template '${values.name}' saved successfully!`);
        isSheetOpen.value = false;
    } catch (error: any) {
        toast.error('Failed to save template', {
            description: error.data?.message || 'An unknown error occurred.'
        });
    }
}
const handleDelete = (template: Template) => {
    toast.promise(templateStore.deleteTemplate(template.id), {
        loading: `Deleting template '${template.name}'...`,
        success: `Template '${template.name}' deleted successfully.`,
        error: (err: any) => err.data?.message || 'Failed to delete template.'
    });
};
</script>

<template>
    <div class="space-y-8">
        <!-- Page Header (unchanged) -->
        <header class="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <NuxtLink to="/">Dashboard</NuxtLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Templates</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">Server Templates</h1>
                    <p class="text-muted-foreground mt-1">Create and manage server blueprints to quickly deploy new
                        instances.</p>
                </div>
                <Button size="lg" class="w-full sm:w-auto" @click="createNewTemplate">
                    <Icon name="lucide:plus" class="mr-2" />
                    Create Template
                </Button>
            </div>
        </header>

        <!-- REFACTORED: Use `pending` for skeletons -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Skeleton v-for="i in 3" :key="i" class="h-56" />
        </div>

        <div v-else-if="error">
            <Card>
                <CardHeader>
                    <CardTitle class="text-destructive">Error Loading Templates</CardTitle>
                    <CardDescription>Could not fetch your template list. Please try refreshing the page.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>

        <!-- Template Grid (unchanged) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card v-for="template in templateStore.templates" :key="template.id" class="flex flex-col">
                <CardHeader>
                    <div class="flex justify-between items-start">
                        <div>
                            <CardTitle>{{ template.name }}</CardTitle>
                            <CardDescription class="mt-1">{{ template.description }}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child><Button variant="ghost" size="icon"
                                    class="h-8 w-8 flex-shrink-0">
                                    <Icon name="lucide:more-vertical" />
                                </Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Icon name="lucide:rocket" class="mr-2 h-4 w-4" /><span>Use Template</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="editTemplate(template)">
                                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" /><span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger as-child>
                                        <DropdownMenuItem @select.prevent class="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" /><span>Delete</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete '{{ template.name }}'?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the template. Servers created from this template will not be affected.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction @click="handleDelete(template)">Confirm Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent class="flex-grow">
                    <div class="text-sm text-muted-foreground">
                        <div class="flex items-center gap-2">
                            <Icon v-if="template.modpackType" name="lucide:box" class="size-4" />
                            <Icon v-else name="mdi:minecraft" class="size-4" />
                            <span v-if="template.modpackType" class="capitalize">{{ template.modpackType.toLowerCase() }} Modpack</span>
                            <span v-else>{{ template.serverType }} {{ template.minecraftVersion }}</span>
                        </div>
                         <div v-if="template.modpackURL" class="flex items-center gap-2 mt-1 truncate">
                            <Icon name="lucide:link" class="size-4" />
                            <span class="truncate">{{ template.modpackURL }}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter class="flex flex-wrap gap-2">
                    <Badge v-for="tag in template.tags" :key="tag" variant="secondary">{{ tag }}</Badge>
                </CardFooter>
            </Card>
            <Button variant="outline"
                class="border-dashed h-full min-h-[220px] flex-col gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200"
                @click="createNewTemplate">
                <Icon name="lucide:plus-circle" class="h-10 w-10" />
                <span class="text-base font-semibold">Create New Template</span>
            </Button>
        </div>

        <!-- Edit/Create Sheet (unchanged) -->
        <Sheet :open="isSheetOpen" @update:open="isSheetOpen = $event">
            <SheetContent class="sm:max-w-[650px] w-full p-0" side="right">
                <Form class="flex flex-col h-full" v-if="editingTemplate" :validation-schema="formSchema"
                    :initial-values="editingTemplate" @submit="onSubmit" v-slot="{ values, setFieldValue }">
                    <SheetHeader class="p-6">
                        <SheetTitle>{{ editingTemplate.id ? 'Edit Template' : 'Create New Template' }}</SheetTitle>
                        <SheetDescription>Configure the server blueprint details.</SheetDescription>
                    </SheetHeader>
                    <ScrollArea class="flex-grow">
                        <div class="p-6 space-y-4">
                            <FormField name="name" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Template Name</FormLabel>
                                    <FormControl><Input v-bind="componentField" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                            <FormField name="description" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea v-bind="componentField" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            </FormField>

                            <FormField name="installType" v-slot="{ value, setValue }">
                                <FormItem>
                                    <FormLabel>Install Type</FormLabel>
                                    <RadioGroup :model-value="value" @update:model-value="setValue" class="flex gap-4 pt-2">
                                        <FormItem class="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="standard" /></FormControl><FormLabel class="font-normal">Standard</FormLabel></FormItem>
                                        <FormItem class="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="modpack" /></FormControl><FormLabel class="font-normal">Modpack</FormLabel></FormItem>
                                    </RadioGroup>
                                    <FormMessage />
                                </FormItem>
                            </FormField>

                            <template v-if="values.installType === 'standard'">
                                <FormField name="serverType" v-slot="{ componentField }"><FormItem><FormLabel>Server Type</FormLabel><Select v-bind="componentField"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem v-for="type in serverTypes" :key="type" :value="type">{{ type }}</SelectItem></SelectContent></Select><FormMessage /></FormItem></FormField>
                                <FormField name="minecraftVersion" v-slot="{ componentField }"><FormItem><FormLabel>Minecraft Version</FormLabel><Select v-bind="componentField"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem v-for="v in minecraftVersions" :key="v" :value="v">{{ v }}</SelectItem></SelectContent></Select><FormMessage /></FormItem></FormField>
                            </template>

                            <template v-if="values.installType === 'modpack'">
                                <FormField name="modpackType" v-slot="{ componentField }">
                                    <FormItem>
                                        <FormLabel>Modpack Provider</FormLabel>
                                        <Select v-bind="componentField">
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="CURSEFORGE">CurseForge</SelectItem>
                                                <SelectItem value="FTB">Feed The Beast</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                </FormField>
                                <FormField name="modpackURL" v-slot="{ componentField }">
                                    <FormItem>
                                        <FormLabel>Modpack URL</FormLabel>
                                        <FormControl><Input placeholder="https://www.curseforge.com/minecraft/modpacks/..." v-bind="componentField" /></FormControl>
                                        <FormDescription>The full URL to the modpack page (e.g., CurseForge page).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                </FormField>
                                 <Alert>
                                    <Icon name="lucide:info" class="h-4 w-4" />
                                    <AlertDescription>Modpack installs automatically determine the required Minecraft and Forge/Fabric version.</AlertDescription>
                                </Alert>
                            </template>
                            <FormField name="javaVersion" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Java Version</FormLabel>
                                    <Select v-bind="componentField"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem v-for="v in javaVersions" :key="v" :value="v">Java {{ v }}</SelectItem></SelectContent></Select>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                             <FormField name="jvmArgs" v-slot="{ value, setValue }">
                                <FormItem>
                                    <FormLabel>JVM Arguments</FormLabel>
                                    <FormControl>
                                        <TagsInput :model-value="value" @update:model-value="setValue">
                                            <TagsInputItem v-for="item in value" :key="item" :value="item">
                                                <TagsInputItemText />
                                                <TagsInputItemDelete />
                                            </TagsInputItem>
                                            <TagsInputInput placeholder="e.g., -XX:+UseG1GC" />
                                        </TagsInput>
                                    </FormControl>
                                    <FormDescription>
                                        Advanced JVM arguments. Memory (-Xmx, -Xms) is set automatically.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                        </div>
                    </ScrollArea>
                    <SheetFooter class="p-6 border-t mt-auto bg-background/95">
                        <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
                        <Button type="submit">Save Template</Button>
                    </SheetFooter>
                </Form>
            </SheetContent>
        </Sheet>
    </div>
</template>