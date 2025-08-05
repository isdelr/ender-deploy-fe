<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useAuthStore } from '~/stores/auth';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: false,
});

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);

const registerSchema = toTypedSchema(
  z.object({
    username: z.string().min(3, 'Username must be at least 3 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
  })
);

async function onSubmit(values: any) {
  isLoading.value = true;
  try {
    await authStore.register(values.username, values.email, values.password);
    toast.success('Registration successful!', {
      description: 'You can now log in with your credentials.',
    });
    router.push('/login');
  } catch (error: any) {
     toast.error('Registration Failed', {
      description: error.data?.message || 'An error occurred during registration.',
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <Form :validation-schema="registerSchema" @submit="onSubmit">
        <CardHeader class="text-center">
           <div class="flex justify-center items-center gap-2 mb-2">
             <Icon name="mdi:minecraft" size="2.5rem" class="text-primary" />
             <span class="text-2xl font-semibold">EnderDeploy</span>
          </div>
          <CardTitle class="text-2xl">Create an Account</CardTitle>
          <CardDescription>Get started with managing your Minecraft servers.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <FormField name="username" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Steve" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField name="email" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="steve@example.com" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
           <FormField name="password" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </CardContent>
        <CardFooter class="flex flex-col gap-4">
          <Button type="submit" class="w-full" :disabled="isLoading">
             <Icon v-if="isLoading" name="lucide:loader-circle" class="animate-spin mr-2" />
            Create Account
          </Button>
           <p class="text-xs text-center text-muted-foreground">
              Already have an account? 
              <NuxtLink to="/login" class="text-primary hover:underline">Sign In</NuxtLink>
          </p>
        </CardFooter>
      </Form>
    </Card>
  </div>
</template>