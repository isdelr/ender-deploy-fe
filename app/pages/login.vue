<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useAuthStore } from '~/stores/auth';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: false, // Use a custom layout or no layout
});

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);

const loginSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
  })
);

async function onSubmit(values: any) {
  isLoading.value = true;
  try {
    await authStore.login(values.email, values.password);
    toast.success('Login successful!');
    router.push('/');
  } catch (error: any) {
    toast.error('Login Failed', {
      description: error.data?.message || 'Invalid email or password.',
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <Form :validation-schema="loginSchema" @submit="onSubmit">
        <CardHeader class="text-center">
          <div class="flex justify-center items-center gap-2 mb-2">
             <Icon name="mdi:minecraft" size="2.5rem" class="text-primary" />
             <span class="text-2xl font-semibold">EnderDeploy</span>
          </div>
          <CardTitle class="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <FormField name="email" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="demo@example.com" v-bind="componentField" />
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
            Sign In
          </Button>
          <p class="text-xs text-center text-muted-foreground">
              Don't have an account? 
              <NuxtLink to="/register" class="text-primary hover:underline">Sign Up</NuxtLink>
          </p>
        </CardFooter>
      </Form>
    </Card>
  </div>
</template>