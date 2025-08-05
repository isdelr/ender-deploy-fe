<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

// --- Zod Validation Schema ---
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters.'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    type: z.string(),
    minecraftVersion: z.string(),
    javaVersion: z.string(),
    minMemory: z.number().positive().optional(),
    maxMemory: z.number().positive().optional(),
    jvmArgs: z.string().optional(),
    gameMode: z.string(),
    difficulty: z.string(),
    hardcore: z.boolean(),
    levelSeed: z.string().optional(),
    maxPlayers: z.number().int().positive(),
    pvp: z.boolean(),
    onlineMode: z.boolean(),
    viewDistance: z.array(z.number()),
    simulationDistance: z.array(z.number()),
  })
);


// --- Data Structures ---
type Template = {
    id: string;
    name: string;
    description: string;
    minecraftVersion: string;
    type: 'Vanilla' | 'Forge' | 'Fabric' | 'Paper';
    tags: string[];
};

// A more complete type for the form data
type EditingTemplate = z.infer<typeof formSchema> & { id?: string };


// --- Mock Data ---
const templates = ref<Template[]>([
    {
        id: '1',
        name: 'Vanilla Survival',
        description: 'A basic template for a standard 1.21 survival server.',
        minecraftVersion: '1.21',
        type: 'Vanilla',
        tags: ['Survival', 'Vanilla', 'Latest'],
    },
    {
        id: '2',
        name: 'All the Mods 9',
        description: 'A complete setup for the All the Mods 9 modpack.',
        minecraftVersion: '1.20.1',
        type: 'Forge',
        tags: ['Modded', 'Forge', 'ATM9'],
    },
    {
        id: '3',
        name: 'Optimized Fabric',
        description: 'A lightweight Fabric server with performance-enhancing mods.',
        minecraftVersion: '1.21',
        type: 'Fabric',
        tags: ['Fabric', 'Performance', 'Sodium'],
    },
]);

const isSheetOpen = ref(false);
// Use the more complete EditingTemplate type
const editingTemplate = ref<Partial<EditingTemplate>>({});

const serverTypes = ['Vanilla', 'Paper', 'Forge', 'Fabric'];
const minecraftVersions = ['1.21', '1.20.4', '1.20.1', '1.19.2', '1.18.2', '1.16.5'];
const javaVersions = ['8', '11', '17', '21'];
const gamemodes = ['survival', 'creative', 'adventure', 'spectator'];
const difficulties = ['peaceful', 'easy', 'normal', 'hard'];

// --- Functions ---
const createNewTemplate = () => {
    editingTemplate.value = {
        name: '',
        description: '',
        tags: [],
        type: 'Vanilla',
        minecraftVersion: minecraftVersions[0],
        javaVersion: '17',
        minMemory: 1024,
        maxMemory: 4096,
        jvmArgs: '',
        gameMode: 'survival',
        difficulty: 'easy',
        hardcore: false,
        levelSeed: '',
        maxPlayers: 20,
        pvp: true,
        onlineMode: true,
        viewDistance: [10],
        simulationDistance: [10],
    };
    isSheetOpen.value = true;
};

const editTemplate = (template: Template) => {
    // Ensure the editing template has all fields, even if the base template doesn't
    editingTemplate.value = {
        id: template.id,
        name: template.name,
        description: template.description,
        tags: [...template.tags],
        type: template.type,
        minecraftVersion: template.minecraftVersion,
        // Add default values for fields not in the base Template type
        javaVersion: '17',
        minMemory: 2048,
        maxMemory: 8192,
        jvmArgs: '-XX:+UseG1GC',
        gameMode: 'survival',
        difficulty: 'normal',
        hardcore: false,
        levelSeed: '',
        maxPlayers: 50,
        pvp: true,
        onlineMode: true,
        viewDistance: [12],
        simulationDistance: [12],
    };
    isSheetOpen.value = true;
};

function onSubmit(values: any) {
  console.log('Form Submitted!', values)
  // Here you would handle the form submission, e.g., by calling an API
  isSheetOpen.value = false;
}

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
                    <p class="text-muted-foreground mt-1">
                        Create and manage server blueprints to quickly deploy new instances.
                    </p>
                </div>
                <Button size="lg" class="w-full sm:w-auto" @click="createNewTemplate">
                    <Icon name="lucide:plus" class="mr-2" />
                    Create Template
                </Button>
            </div>
        </header>

        <!-- Template Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card v-for="template in templates" :key="template.id" class="flex flex-col">
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
                            <span>{{ template.type }} {{ template.minecraftVersion }}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter class="flex flex-wrap gap-2">
                    <Badge v-for="tag in template.tags" :key="tag" variant="secondary">{{ tag }}</Badge>
                </CardFooter>
            </Card>
            <!-- Add New Template Card -->
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
                        <SheetDescription>
                            Configure the server blueprint details. This will be used to create new server instances.
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea class="flex-grow">
                        <div class="px-6 pb-6">
                           <Tabs default-value="general">
                                <TabsList class="mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                                    <TabsTrigger value="general">General</TabsTrigger>
                                    <TabsTrigger value="core">Core</TabsTrigger>
                                    <TabsTrigger value="java">Java</TabsTrigger>
                                    <TabsTrigger value="properties">Properties</TabsTrigger>
                                </TabsList>
                                <TabsContent value="general" class="space-y-4">
                                     <FormField name="name" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Template Name</FormLabel>
                                            <FormControl>
                                                <Input v-bind="componentField" placeholder="e.g., ATM9 Server" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                    <FormField name="description" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea v-bind="componentField"
                                                    placeholder="A brief description of this template." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                    <FormField name="tags" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Tags</FormLabel>
                                            <FormControl>
                                                <TagsInput v-bind="componentField">
                                                    <TagsInputItem v-for="item in componentField.modelValue || []" :key="item"
                                                        :value="item">
                                                        <TagsInputItemText />
                                                        <TagsInputItemDelete />
                                                    </TagsInputItem>
                                                    <TagsInputInput placeholder="Add a tag..." />
                                                </TagsInput>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                </TabsContent>
                                <TabsContent value="core" class="space-y-4">
                                    <FormField name="type" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Server Type</FormLabel>
                                            <Select v-bind="componentField">
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select server type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem v-for="type in serverTypes" :key="type" :value="type">{{ type }}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                    <FormField name="minecraftVersion" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Minecraft Version</FormLabel>
                                             <Select v-bind="componentField">
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Minecraft version" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem v-for="version in minecraftVersions" :key="version" :value="version">{{ version }}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                </TabsContent>
                                <TabsContent value="java" class="space-y-4">
                                     <FormField name="javaVersion" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Java Version</FormLabel>
                                            <Select v-bind="componentField">
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Java version" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem v-for="version in javaVersions" :key="version" :value="version">Java {{ version }}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                    <div class="grid grid-cols-2 gap-4">
                                        <FormField name="minMemory" v-slot="{ componentField }">
                                            <FormItem>
                                                <FormLabel>Minimum Memory (MB)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="1024" v-bind="componentField" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>
                                        <FormField name="maxMemory" v-slot="{ componentField }">
                                            <FormItem>
                                                <FormLabel>Maximum Memory (MB)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="4096" v-bind="componentField" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>
                                    </div>
                                    <FormField name="jvmArgs" v-slot="{ componentField }">
                                        <FormItem>
                                            <FormLabel>Advanced JVM Arguments</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="-XX:+UseG1GC -XX:+ParallelRefProcEnabled ..." class="font-mono" v-bind="componentField" />
                                            </FormControl>
                                            <FormDescription>
                                                Advanced users only. These flags are passed directly to the Java executable.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                </TabsContent>
                                <TabsContent value="properties">
                                    <Accordion type="multiple" class="w-full">
                                        <AccordionItem value="world">
                                            <AccordionTrigger>World Settings</AccordionTrigger>
                                            <AccordionContent class="pt-4 space-y-4">
                                                <FormField name="gameMode" v-slot="{ componentField }">
                                                    <FormItem>
                                                        <FormLabel>Game Mode</FormLabel>
                                                        <Select v-bind="componentField">
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                            </FormControl>
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
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem v-for="diff in difficulties" :key="diff" :value="diff" class="capitalize">{{ diff }}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                </FormField>
                                                <FormField name="hardcore" v-slot="{ value, setValue }">
                                                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div class="space-y-0.5">
                                                            <FormLabel>Hardcore</FormLabel>
                                                            <FormDescription>If enabled, players are banned on death.</FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch :checked="value" @update:checked="setValue" />
                                                        </FormControl>
                                                    </FormItem>
                                                </FormField>
                                                <FormField name="levelSeed" v-slot="{ componentField }">
                                                    <FormItem>
                                                        <FormLabel>Level Seed</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Leave blank for random" v-bind="componentField" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                </FormField>
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="player">
                                            <AccordionTrigger>Player & Network</AccordionTrigger>
                                            <AccordionContent class="pt-4 space-y-4">
                                                <FormField name="maxPlayers" v-slot="{ componentField }">
                                                    <FormItem>
                                                        <FormLabel>Max Players</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" v-bind="componentField" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                </FormField>
                                                <FormField name="pvp" v-slot="{ value, setValue }">
                                                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div class="space-y-0.5">
                                                            <FormLabel>Enable PvP</FormLabel>
                                                            <FormDescription>Allow player vs. player combat.</FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch :checked="value" @update:checked="setValue" />
                                                        </FormControl>
                                                    </FormItem>
                                                </FormField>
                                                 <FormField name="onlineMode" v-slot="{ value, setValue }">
                                                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div class="space-y-0.5">
                                                            <FormLabel>Online Mode</FormLabel>
                                                            <FormDescription>Verify players with Mojang servers.</FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch :checked="value" @update:checked="setValue" />
                                                        </FormControl>
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
                                                 <FormField name="simulationDistance" v-slot="{ componentField }">
                                                    <FormItem>
                                                         <FormLabel>Simulation Distance ({{ componentField.modelValue?.[0] || 10 }})</FormLabel>
                                                        <FormControl>
                                                            <Slider v-bind="componentField" :max="32" :min="2" :step="1" />
                                                        </FormControl>
                                                    </FormItem>
                                                </FormField>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ScrollArea>

                    <SheetFooter class="p-6 border-t mt-auto bg-background/95 backdrop-blur-sm z-10">
                        <Button type="button" variant="outline" @click="isSheetOpen = false">Cancel</Button>
                        <Button type="submit">Save Template</Button>
                    </SheetFooter>
                </Form>
            </SheetContent>
        </Sheet>
    </div>
</template>