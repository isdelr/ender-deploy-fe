<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useTemplateStore } from '~/stores/template';
import { toast } from 'vue-sonner';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Templates - EnderDeploy' });

const templateStore = useTemplateStore();

onMounted(() => {
    templateStore.fetchTemplates();
});

// Zod Schema and Data
const formSchema = toTypedSchema(
  z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Name must be at least 3 characters.'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    serverType: z.string(), // Renamed from 'type' to avoid conflict
    minecraftVersion: z.string(),
    javaVersion: z.string(),
    minMemoryMB: z.number().positive(),
    maxMemoryMB: z.number().positive(),
    jvmArgs: z.array(z.string()).optional(),
    properties: z.record(z.string()).optional(), // A simple way to handle properties map
  })
);

type Template = z.infer<typeof formSchema>;

const isSheetOpen = ref(false);
const editingTemplate = ref<Partial<Template>>({});

const serverTypes = ['Vanilla', 'Paper', 'Forge', 'Fabric'];
const minecraftVersions = ['1.21', '1.20.4', '1.20.1', '1.19.2', '1.18.2', '1.16.5'];
const javaVersions = ['8', '11', '17', '21'];

// Functions
const createNewTemplate = () => {
    editingTemplate.value = {
        name: '',
        description: '',
        tags: [],
        serverType: 'Paper',
        minecraftVersion: minecraftVersions[0],
        javaVersion: '17',
        minMemoryMB: 1024,
        maxMemoryMB: 4096,
        jvmArgs: [],
        properties: {
            'gamemode': 'survival',
            'difficulty': 'easy',
            'hardcore': 'false',
            'max-players': '20',
            'pvp': 'true',
            'online-mode': 'true',
            'view-distance': '10',
            'simulation-distance': '10'
        },
    };
    isSheetOpen.value = true;
};

const editTemplate = (template: Template) => {
    editingTemplate.value = JSON.parse(JSON.stringify(template)); // Deep copy
    isSheetOpen.value = true;
};

async function onSubmit(values: any) {
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
</script>

<template>
    <div class="space-y-8">
        <!-- Page Header -->
        <header class="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><NuxtLink to="/">Dashboard</NuxtLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Templates</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">Server Templates</h1>
                    <p class="text-muted-foreground mt-1">Create and manage server blueprints to quickly deploy new instances.</p>
                </div>
                <Button size="lg" class="w-full sm:w-auto" @click="createNewTemplate">
                    <Icon name="lucide:plus" class="mr-2" />
                    Create Template
                </Button>
            </div>
        </header>

        <!-- Skeletons -->
        <div v-if="templateStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Skeleton v-for="i in 3" :key="i" class="h-56" />
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
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="icon" class="h-8 w-8 flex-shrink-0">
                                    <Icon name="lucide:more-vertical" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Icon name="lucide:rocket" class="mr-2 h-4 w-4" />
                                    <span>Use Template</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="editTemplate(template)">
                                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem class="text-destructive">
                                    <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
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

        <!-- Edit/Create Sheet -->
        <Sheet :open="isSheetOpen" @update:open="isSheetOpen = $event">
            <SheetContent class="sm:max-w-[650px] w-full p-0" side="right">
                <Form class="flex flex-col h-full" v-if="editingTemplate" :validation-schema="formSchema" :initial-values="editingTemplate" @submit="onSubmit">
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
                             <FormField name="serverType" v-slot="{ componentField }">
                                <FormItem>
                                    <FormLabel>Server Type</FormLabel>
                                    <Select v-bind="componentField">
                                        <FormControl>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem v-for="type in serverTypes" :key="type" :value="type">{{ type }}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                            <!-- Other fields would go here -->
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