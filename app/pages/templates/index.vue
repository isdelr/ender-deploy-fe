<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useTemplateStore } from '~/stores/template';
import { useServerStore } from '~/stores/server';
import { toast } from 'vue-sonner';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from '~/components/ui/combobox';
import { Slider } from '~/components/ui/slider';
import { cn } from '~/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-vue-next';


useHead({ title: 'Templates - EnderDeploy' });

const templateStore = useTemplateStore();
const serverStore = useServerStore();


const { pending: isLoading, error } = await useAsyncData('templates-data', () =>
    templateStore.fetchTemplates()
);

const availableRam = computed(() => {
  if (!serverStore.systemStats) return 4096; // Default fallback
  return serverStore.systemStats.totalRAM - serverStore.systemStats.allocatedRAM;
});


const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_FILE_TYPES = ["application/zip", "application/x-zip-compressed"];

const createSchema = toTypedSchema(
    z.object({
        name: z.string().min(3, 'Name must be at least 3 characters.'),
        description: z.string().optional(),
        minecraftVersion: z.string({ required_error: 'Minecraft Version is required.' }),
        javaVersion: z.string({ required_error: 'Java Version is required.' }),
        maxMemoryMB: z.array(z.number()).min(1).max(1),
        file: z
            .instanceof(File, { message: "A .zip file is required." })
            .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 500MB.`)
            .refine(
                (file) => ACCEPTED_FILE_TYPES.includes(file.type),
                "Only .zip files are supported."
            ),
        serverExecutable: z.string({ required_error: 'Please select an executable file.' }),
    })
);

const editSchema = toTypedSchema(
    z.object({
        id: z.string().optional(),
        name: z.string().min(3, 'Name must be at least 3 characters.'),
        description: z.string().optional(),
    })
);

type Template = Partial<z.infer<typeof createSchema>> & { id?: string; name?: string; description?: string, serverType?: string, minecraftVersion?: string, tags?: string[] };


const isSheetOpen = ref(false);
const sheetMode = ref<'create' | 'edit'>('create');
const editingTemplate = ref<Template>({});
const javaVersions = ['8', '11', '17', '21'];
const minecraftVersions = ref<string[]>([]);
const zipFiles = ref<string[]>([]);
const isParsingZip = ref(false);

onMounted(async () => {
    serverStore.fetchSystemStats();
    if (templateStore.minecraftVersions.length === 0) {
        minecraftVersions.value = await templateStore.fetchMinecraftVersions();
    } else {
        minecraftVersions.value = templateStore.minecraftVersions;
    }
});

const createNewTemplate = () => {
    sheetMode.value = 'create';
    editingTemplate.value = {
        name: '', description: '',
        minecraftVersion: minecraftVersions.value.length > 0 ? minecraftVersions.value[0] : '',
        javaVersion: '17',
        maxMemoryMB: [4096],
    };
    zipFiles.value = [];
    isSheetOpen.value = true;
};

const editTemplate = (template: Template) => {
    sheetMode.value = 'edit';
    editingTemplate.value = JSON.parse(JSON.stringify({
        id: template.id,
        name: template.name,
        description: template.description,
    }));
    isSheetOpen.value = true;
};

const handleFileChange = async (
  event: Event,
  fieldSetter: (file: File | undefined) => void,
  formSetter: (field: string, value: any) => void
) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  fieldSetter(file);
  formSetter("serverExecutable", undefined);

  if (file && ACCEPTED_FILE_TYPES.includes(file.type)) {
    isParsingZip.value = true;
    zipFiles.value = [];
    try {
      const files = await serverStore.listZipContents(file);
      zipFiles.value = files;
      if (files.length === 0) {
        toast.info("No executables found", {
          description: "We couldn't find any .jar or .sh files in the zip's root.",
        });
      }
    } catch (e: any) {
      toast.error("Could not read .zip file.", {
        description: e.data?.message || "The file might be corrupted.",
      });
    } finally {
      isParsingZip.value = false;
    }
  } else {
    zipFiles.value = [];
  }
};

async function onCreateSubmit(values: any) {
    const payload = {
        ...values,
        maxMemoryMB: values.maxMemoryMB[0] // Extract value from slider's array
    }
    toast.promise(templateStore.createTemplateFromUpload(payload), {
        loading: 'Creating template...',
        success: () => {
            isSheetOpen.value = false;
            return `Template '${values.name}' created successfully!`;
        },
        error: (err: any) => err.data?.message || 'Failed to create template.'
    });
}

async function onEditSubmit(values: any) {
    toast.promise(templateStore.updateTemplate(values), {
        loading: 'Updating template...',
        success: () => {
            isSheetOpen.value = false;
            return `Template '${values.name}' updated successfully!`;
        },
        error: (err: any) => err.data?.message || 'Failed to update template.'
    });
}

const handleDelete = (template: Template) => {
    if (!template.id) return;
    toast.promise(templateStore.deleteTemplate(template.id), {
        loading: `Deleting template '${template.name}'...`,
        success: `Template '${template.name}' deleted successfully.`,
        error: (err: any) => err.data?.message || 'Failed to delete template.'
    });
};
</script>

<template>
    <div class="space-y-8">
        <!-- Page Header -->
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

        <!-- Loading / Error State -->
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

        <!-- Template Grid -->
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
                                <NuxtLink :to="`/servers/create?template=${template.id}`">
                                    <DropdownMenuItem>
                                        <Icon name="lucide:rocket" class="mr-2 h-4 w-4" /><span>Use Template</span>
                                    </DropdownMenuItem>
                                </NuxtLink>
                                <DropdownMenuItem @click="editTemplate(template)">
                                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" /><span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger as-child>
                                        <DropdownMenuItem @select.prevent variant="destructive">
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
                            <Icon name="mdi:minecraft" class="size-4" />
                            <span>{{ template.serverType }} {{ template.minecraftVersion }}</span>
                        </div>
                         <div class="flex items-center gap-2 mt-2">
                            <Icon name="lucide:server" class="size-4" />
                            <span>From {{ template.serverType === 'custom-zip' ? 'Zip Upload' : 'URL' }}</span>
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

        <Sheet :open="isSheetOpen" @update:open="isSheetOpen = $event">
            <SheetContent class="sm:max-w-[650px] w-full p-0" side="right">
                <!-- CREATE FORM -->
                <Form v-if="sheetMode === 'create'" class="flex flex-col h-full"
                    :validation-schema="createSchema"
                    :initial-values="editingTemplate"
                    @submit="onCreateSubmit"
                    v-slot="{ setFieldValue, values }">
                    <SheetHeader class="p-6">
                        <SheetTitle>Create New Template</SheetTitle>
                        <SheetDescription>Upload a .zip file with your server files to create a reusable blueprint.</SheetDescription>
                    </SheetHeader>
                    <ScrollArea class="flex-grow">
                        <div class="p-6 space-y-4">
                            <FormField name="name" v-slot="{ componentField }"><FormItem><FormLabel>Template Name</FormLabel><FormControl><Input placeholder="Custom Forge 1.19.2 Server" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                            <FormField name="description" v-slot="{ componentField }"><FormItem><FormLabel>Description</FormLabel><FormControl><Textarea v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                            <FormField name="file" v-slot="{ setValue, handleBlur }">
                                <FormItem>
                                    <FormLabel>Server Files (.zip)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".zip,application/zip,application/x-zip-compressed"
                                            @change="(e) => handleFileChange(e, setValue, setFieldValue)"
                                            @blur="handleBlur"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                            <FormField v-if="values.file" name="serverExecutable" v-slot="{ componentField }">
                                <FormItem class="flex flex-col">
                                <FormLabel>Executable File</FormLabel>
                                <Combobox v-bind="componentField" class="w-full" open-on-click :disabled="zipFiles.length <= 0 || isParsingZip">
                                    <FormControl>
                                    <ComboboxAnchor>
                                        <div class="relative w-full items-center">
                                        <ComboboxInput placeholder="Select executable..." v-bind="componentField" />
                                        <div class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                                                <Icon v-if="isParsingZip" name="lucide:loader-circle" class="size-4 animate-spin"/>
                                                <ChevronsUpDown v-else class="size-4 text-muted-foreground" />
                                        </div>
                                        </div>
                                    </ComboboxAnchor>
                                    </FormControl>
                                    <ComboboxList>
                                    <ComboboxEmpty> No executable found in zip. </ComboboxEmpty>
                                    <ComboboxGroup>
                                        <ComboboxItem v-for="file in zipFiles" :key="file" :value="file">
                                        {{ file }}
                                        <ComboboxItemIndicator>
                                            <Check :class="cn('ml-auto h-4 w-4')" />
                                        </ComboboxItemIndicator>
                                        </ComboboxItem>
                                    </ComboboxGroup>
                                    </ComboboxList>
                                </Combobox>
                                <FormDescription>Select the main .jar or .sh file from your zip archive.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            </FormField>
                            <div class="grid grid-cols-2 gap-4">
                                <FormField name="minecraftVersion" v-slot="{ componentField }"><FormItem><FormLabel>Minecraft Version</FormLabel><FormControl><Input placeholder="e.g., 1.20.1" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                                <FormField name="javaVersion" v-slot="{ componentField }"><FormItem><FormLabel>Java Version</FormLabel><Select v-bind="componentField"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem v-for="v in javaVersions" :key="v" :value="v">Java {{ v }}</SelectItem></SelectContent></Select><FormMessage /></FormItem></FormField>
                            </div>
                            <FormField name="maxMemoryMB" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Max Server RAM</FormLabel>
                                    <div class="flex items-center gap-4">
                                        <FormControl>
                                            <Slider
                                                v-bind="componentField"
                                                :min="512"
                                                :max="availableRam"
                                                :step="512"
                                                class="w-full"
                                            />
                                        </FormControl>
                                        <div class="font-mono text-sm w-28 text-center shrink-0 p-2 bg-muted rounded-md">
                                            {{ values.maxMemoryMB ? values.maxMemoryMB[0] : 0 }} MB
                                        </div>
                                    </div>
                                    <FormDescription>
                                        The maximum memory for the Minecraft server. Min memory will be set to 1GB.
                                         <span v-if="serverStore.systemStats">
                                            Available on system: {{ availableRam }}MB
                                        </span>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            </FormField>

                        </div>
                    </ScrollArea>
                    <SheetFooter class="p-6 border-t mt-auto bg-background/95">
                        <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
                        <Button type="submit">Create Template</Button>
                    </SheetFooter>
                </Form>
                 <!-- EDIT FORM -->
                <Form v-if="sheetMode === 'edit'" class="flex flex-col h-full"
                    :validation-schema="editSchema"
                    :initial-values="editingTemplate"
                    @submit="onEditSubmit">
                    <SheetHeader class="p-6">
                        <SheetTitle>Edit Template</SheetTitle>
                        <SheetDescription>Update the template's name and description.</SheetDescription>
                    </SheetHeader>
                    <ScrollArea class="flex-grow">
                        <div class="p-6 space-y-4">
                            <FormField name="name" v-slot="{ componentField }"><FormItem><FormLabel>Template Name</FormLabel><FormControl><Input v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                            <FormField name="description" v-slot="{ componentField }"><FormItem><FormLabel>Description</FormLabel><FormControl><Textarea v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
                        </div>
                    </ScrollArea>
                    <SheetFooter class="p-6 border-t mt-auto bg-background/95">
                        <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </SheetFooter>
                </Form>
            </SheetContent>
        </Sheet>
    </div>
</template>