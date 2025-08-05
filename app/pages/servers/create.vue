<script setup lang="ts">
import { ref } from 'vue';
import { useTemplateStore } from '~/stores/template';
import { useServerStore } from '~/stores/server';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';

useHead({ title: 'Create Server - EnderDeploy' });

const templateStore = useTemplateStore();
const serverStore = useServerStore();
const router = useRouter();

const currentStep = ref(1);
const isLoading = ref(false);

const formSchema = toTypedSchema(
  z.object({
    templateId: z.string({ required_error: 'Please select a template.' }),
    serverName: z.string().min(3, 'Server name must be at least 3 characters.'),
  })
);

const onStep = (step: number) => {
  currentStep.value = step;
};

async function onSubmit(values: any) {
  isLoading.value = true;
  try {
    await serverStore.createServer(values.serverName, values.templateId);
    toast.success('Server creation started!', {
      description: 'Your new server is being provisioned and will appear on the servers page shortly.',
    });
    router.push('/servers');
  } catch (error: any) {
    toast.error('Creation Failed', {
      description: error.data?.message || 'Could not create the server.',
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  templateStore.fetchTemplates();
});

const selectedTemplate = ref<any>(null);

const handleTemplateSelection = (template: any, setFieldValue: Function) => {
    selectedTemplate.value = template;
    setFieldValue('templateId', template.id);
    currentStep.value = 2;
}

</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><NuxtLink to="/">Dashboard</NuxtLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><NuxtLink to="/servers">Servers</NuxtLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Create</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Create a New Server</h1>
        <p class="text-muted-foreground mt-1">Follow the steps below to deploy a new server instance.</p>
      </div>
    </header>
    
    <Form :validation-schema="formSchema" @submit="onSubmit" v-slot="{ setFieldValue, values }">
        <Stepper class="w-full justify-center" orientation="horizontal" :model-value="currentStep" @update:model-value="onStep">
            <StepperItem :step="1">
                <StepperTrigger>
                    <StepperIndicator>1</StepperIndicator>
                    <div>
                        <StepperTitle>Select Template</StepperTitle>
                        <StepperDescription>Choose a server blueprint</StepperDescription>
                    </div>
                </StepperTrigger>
                <StepperSeparator />
            </StepperItem>
            <StepperItem :step="2">
                <StepperTrigger>
                    <StepperIndicator>2</StepperIndicator>
                    <div>
                        <StepperTitle>Configure</StepperTitle>
                        <StepperDescription>Set basic server details</StepperDescription>
                    </div>
                </StepperTrigger>
                <StepperSeparator />
            </StepperItem>
             <StepperItem :step="3">
                <StepperTrigger>
                    <StepperIndicator>3</StepperIndicator>
                    <div>
                        <StepperTitle>Deploy</StepperTitle>
                        <StepperDescription>Review and launch</StepperDescription>
                    </div>
                </StepperTrigger>
            </StepperItem>
        </Stepper>

        <div class="mt-8">
            <!-- Step 1: Select Template -->
            <div v-show="currentStep === 1">
                <h2 class="text-2xl font-semibold mb-4 text-center">Choose a Template</h2>
                <div v-if="templateStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <Skeleton v-for="i in 3" :key="i" class="h-48" />
                </div>
                 <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <Card v-for="template in templateStore.templates" :key="template.id"
                        class="cursor-pointer hover:border-primary transition-colors"
                        @click="handleTemplateSelection(template, setFieldValue)">
                        <CardHeader>
                             <CardTitle>{{ template.name }}</CardTitle>
                            <CardDescription class="mt-1">{{ template.description }}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div class="text-sm text-muted-foreground">
                                <div class="flex items-center gap-2">
                                    <Icon name="mdi:minecraft" class="size-4" />
                                    <span>{{ template.type }} {{ template.minecraftVersion }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Step 2: Configure Details -->
            <div v-show="currentStep === 2" class="max-w-xl mx-auto space-y-6">
                 <h2 class="text-2xl font-semibold mb-4 text-center">Configure Your Server</h2>
                 <Card>
                    <CardContent class="pt-6 space-y-4">
                        <FormField name="serverName" v-slot="{ componentField }">
                            <FormItem>
                                <FormLabel>Server Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My Awesome Server" v-bind="componentField" />
                                </FormControl>
                                <FormDescription>This will be shown in the panel and as the default MOTD.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </CardContent>
                 </Card>
                 <div class="flex justify-between">
                     <Button type="button" variant="outline" @click="currentStep = 1">Back</Button>
                     <Button type="button" @click="currentStep = 3">Next</Button>
                 </div>
            </div>

            <!-- Step 3: Deploy -->
            <div v-show="currentStep === 3" class="max-w-xl mx-auto space-y-6">
                 <h2 class="text-2xl font-semibold mb-4 text-center">Review and Deploy</h2>
                 <Card>
                    <CardHeader>
                        <CardTitle>Deployment Summary</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Server Name:</span>
                            <span class="font-medium">{{ values.serverName }}</span>
                        </div>
                         <div class="flex justify-between">
                            <span class="text-muted-foreground">Template:</span>
                            <span class="font-medium">{{ selectedTemplate?.name }}</span>
                        </div>
                         <div class="flex justify-between">
                            <span class="text-muted-foreground">MC Version:</span>
                            <span class="font-medium">{{ selectedTemplate?.minecraftVersion }}</span>
                        </div>
                         <div class="flex justify-between">
                            <span class="text-muted-foreground">Server Type:</span>
                            <span class="font-medium">{{ selectedTemplate?.type }}</span>
                        </div>
                    </CardContent>
                 </Card>
                  <div class="flex justify-between">
                     <Button type="button" variant="outline" @click="currentStep = 2">Back</Button>
                     <Button type="submit" :disabled="isLoading">
                         <Icon v-if="isLoading" name="lucide:loader-circle" class="animate-spin mr-2" />
                         Deploy Server
                    </Button>
                 </div>
            </div>
        </div>
    </Form>
  </div>
</template>