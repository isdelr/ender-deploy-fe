// Path: ender-deploy-fe/app/pages/servers/create.vue
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTemplateStore } from "~/stores/template";
import { useServerStore } from "~/stores/server";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { toast } from "vue-sonner";
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
} from "~/components/ui/combobox";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";
import { Check, ChevronsUpDown } from "lucide-vue-next";

useHead({ title: "Create Server - EnderDeploy" });

const templateStore = useTemplateStore();
const serverStore = useServerStore();
const router = useRouter();

const isLoading = ref(false);
const javaVersions = ["8", "11", "17", "21"];
const zipFiles = ref<string[]>([]);
const isParsingZip = ref(false);

const availableRam = computed(() => {
  if (!serverStore.systemStats) return 16000;
  return serverStore.systemStats.totalRAM - serverStore.systemStats.allocatedRAM;
});

const templateFormSchema = toTypedSchema(
  z.object({
    templateId: z.string({ required_error: "Please select a template." }),
    serverName: z.string().min(3, "Server name must be at least 3 characters."),
  })
);

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_FILE_TYPES = ["application/zip", "application/x-zip-compressed"];

const uploadFormSchema = toTypedSchema(
  z.object({
    serverName: z.string().min(3, "Server name must be at least 3 characters."),
    javaVersion: z.string({ required_error: "Please select a Java version." }),
    serverExecutable: z.string({
      required_error: "Please select an executable file.",
    }),
    maxMemoryMB: z.array(z.number()).min(1).max(1),
    file: z
      .instanceof(File, { message: "A .zip file is required." })
      .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 500MB.`)
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .zip files are supported."
      ),
  })
);

const handleFileChange = async (
  event: Event,
  fieldSetter: (file: File | undefined) => void,
  formSetter: (field: string, value: any) => void
) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  fieldSetter(file);
  formSetter("serverExecutable", undefined); // Reset serverExecutable field on new file selection

  if (file && ACCEPTED_FILE_TYPES.includes(file.type)) {
    isParsingZip.value = true;
    zipFiles.value = [];
    try {
      // Call the store action to get files from the backend
      const files = await serverStore.listZipContents(file);
      zipFiles.value = files;
      if (files.length === 0) {
        toast.info("No executables found", {
          description:
            "We couldn't find any .jar or .sh files in the zip archive.",
        });
      }
    } catch (e: any) {
      toast.error("Could not read .zip file.", {
        description:
          e.data?.message ||
          "The file might be corrupted or not a valid zip archive.",
      });
      console.error(e);
    } finally {
      isParsingZip.value = false;
    }
  } else {
    zipFiles.value = [];
  }
};

async function onUploadSubmit(values: any) {
  isLoading.value = true;
  try {
    await serverStore.createServerFromUpload(
      values.serverName,
      values.javaVersion,
      values.serverExecutable,
      values.maxMemoryMB[0], // Slider value is an array
      values.file
    );
    toast.success("Server creation started!", {
      description:
        "Your uploaded server is being provisioned and will appear on the servers page shortly.",
    });
    router.push("/servers");
  } catch (error: any) {
    toast.error("Upload Failed", {
      description:
        error.data?.message ||
        "Could not create the server from the uploaded file.",
    });
  } finally {
    isLoading.value = false;
  }
}

async function onTemplateSubmit(values: any) {
  isLoading.value = true;
  try {
    await serverStore.createServer(values.serverName, values.templateId);
    toast.success("Server creation started!", {
      description:
        "Your new server is being provisioned and will appear on the servers page shortly.",
    });
    router.push("/servers");
  } catch (error: any) {
    toast.error("Creation Failed", {
      description: error.data?.message || "Could not create the server.",
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  templateStore.fetchTemplates();
  serverStore.fetchSystemStats();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <NuxtLink to="/">Dashboard</NuxtLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <NuxtLink to="/servers">Servers</NuxtLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Create a New Server</h1>
        <p class="text-muted-foreground mt-1">
          Follow the steps below to deploy a new server instance.
        </p>
      </div>
    </header>

    <Tabs default-value="template" class="w-full">
      <TabsList class="grid w-full max-w-lg mx-auto grid-cols-2">
        <TabsTrigger value="template">
          <Icon name="lucide:layout-template" class="mr-2" />Create from
          Template
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Icon name="lucide:upload-cloud" class="mr-2" />Upload Server (.zip)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="template" class="pt-6">
        <Card class="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create from Template</CardTitle>
            <CardDescription
              >Select a pre-configured template to quickly start a new server.
            </CardDescription>
          </CardHeader>
          <Form
            :validation-schema="templateFormSchema"
            @submit="onTemplateSubmit"
          >
            <CardContent class="space-y-4 mb-6">
              <FormField name="serverName" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Server"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormDescription
                    >This will be shown in the panel and as the default MOTD.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="templateId" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select v-bind="componentField">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        v-for="template in templateStore.templates"
                        :key="template.id"
                        :value="template.id"
                        >{{ template.name }} ({{ template.minecraftVersion }})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
            <CardFooter>
              <Button type="submit" :disabled="isLoading">
                <Icon
                  v-if="isLoading"
                  name="lucide:loader-circle"
                  class="animate-spin mr-2"
                />
                Create Server
              </Button>
            </CardFooter>
          </Form>
        </Card>
      </TabsContent>

      <TabsContent value="upload" class="pt-6">
        <Card class="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Custom Server</CardTitle>
            <CardDescription
              >Upload a .zip file containing your complete server files (world,
              server.jar, mods, etc.).</CardDescription
            >
          </CardHeader>
          <Form
            :validation-schema="uploadFormSchema"
            @submit="onUploadSubmit"
            :initial-values="{ maxMemoryMB: [4096] }"
            v-slot="{ setFieldValue }"
          >
            <CardContent class="space-y-4 mb-6">
              <FormField name="serverName" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl
                    ><Input
                      placeholder="My Custom Server"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="javaVersion" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Java Version</FormLabel
                  ><Select v-bind="componentField">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Java Version..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem v-for="v in javaVersions" :key="v" :value="v"
                        >Java {{ v }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>
              
              <FormField name="maxMemoryMB" v-slot="{ value, setValue }">
                <FormItem>
                    <FormLabel>Max Server RAM</FormLabel>
                    <div class="flex items-center gap-4">
                        <FormControl>
                            <Slider
                                :model-value="value"
                                @update:model-value="setValue"
                                :min="512"
                                :max="availableRam"
                                :step="512"
                                class="w-full"
                            />
                        </FormControl>
                        <div class="font-mono text-sm w-28 text-center shrink-0 p-2 bg-muted rounded-md">
                            {{ value ? value[0] : 0 }} MB
                        </div>
                    </div>
                    <FormDescription>
                        The maximum memory for the Minecraft server. An additional 512MB will be allocated for the container.
                        <span v-if="serverStore.systemStats">
                            Available on system: {{ availableRam }}MB
                        </span>
                    </FormDescription>
                    <FormMessage />
                </FormItem>
              </FormField>

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
              <FormField name="serverExecutable" v-slot="{ componentField }">
                <FormItem class="flex flex-col">
                  <FormLabel>Executable</FormLabel>
                  <Combobox v-bind="componentField" open-on-click :disabled="zipFiles.length <= 0">
                    <ComboboxAnchor>
                      <div class="relative w-full items-center">
                        <FormControl>
                          <ComboboxInput placeholder="Select executable..." v-bind="componentField" />
                        </FormControl>
                        <ComboboxTrigger
                          class="absolute end-0 inset-y-0 flex items-center justify-center px-3"
                        >
                          <ChevronsUpDown
                            class="size-4 text-muted-foreground"
                          />
                        </ComboboxTrigger>
                      </div>
                    </ComboboxAnchor>
                    <ComboboxList>
                      <ComboboxEmpty> Nothing found. </ComboboxEmpty>
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
                  <FormDescription>
                    Select the executable file (.jar, .sh, etc.) from your zip.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
            <CardFooter>
              <Button type="submit" :disabled="isLoading">
                <Icon
                  v-if="isLoading"
                  name="lucide:loader-circle"
                  class="animate-spin mr-2"
                />
                Upload and Create
              </Button>
            </CardFooter>
          </Form>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>