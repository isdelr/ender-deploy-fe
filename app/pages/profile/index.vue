<script setup lang="ts">
import { ref, computed } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useAuthStore } from '~/stores/auth';
import { toast } from 'vue-sonner';

useHead({ title: 'User Profile - EnderDeploy' });

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const profileSchema = toTypedSchema(
  z.object({
    username: z.string().min(3, 'Username must be at least 3 characters.').max(20),
    email: z.string().email('Please enter a valid email address.'),
  })
);

const passwordSchema = toTypedSchema(
  z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
);

function onProfileSubmit(values: any) {
  toast.promise(authStore.updateUser(values), {
    loading: 'Updating profile...',
    success: 'Profile updated successfully!',
    error: (err) => err.data?.message || 'Failed to update profile.',
  });
}

function onPasswordSubmit(values: any, { resetForm }: any) {
  toast.promise(authStore.changePassword(values), {
    loading: 'Changing password...',
    success: () => {
        resetForm();
        return 'Password changed successfully!';
    },
    error: (err) => err.data?.message || 'Failed to change password.',
  });
}

function handleDeleteAccount() {
    toast.promise(authStore.deleteAccount(), {
        loading: 'Deleting account...',
        success: 'Account deleted successfully. You have been logged out.',
        error: (err) => err.data?.message || 'Failed to delete account.'
    });
}
</script>

<template>
  <div v-if="user" class="space-y-8">
    <!-- Page Header -->
    <header class="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><NuxtLink to="/">Dashboard</NuxtLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Profile</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p class="text-muted-foreground mt-1">Manage your account settings and credentials.</p>
      </div>
    </header>

    <!-- Profile Content -->
    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-2 sm:max-w-[240px]">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <!-- Profile Tab -->
      <TabsContent value="profile" class="pt-6">
        <Card>
          <Form :validation-schema="profileSchema" :initial-values="user" @submit="onProfileSubmit">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your username and email address.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <FormField name="username" v-slot="{ componentField }"><FormItem><FormLabel>Username</FormLabel><FormControl><Input v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
              <FormField name="email" v-slot="{ componentField }"><FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
            </CardContent>
            <CardFooter class="border-t pt-6">
              <Button type="submit">Update Profile</Button>
            </CardFooter>
          </Form>
        </Card>
      </TabsContent>

      <!-- Security Tab -->
      <TabsContent value="security" class="pt-6 space-y-6">
        <Card>
          <Form :validation-schema="passwordSchema" @submit="onPasswordSubmit">
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent class="space-y-4">
              <FormField name="currentPassword" v-slot="{ componentField }"><FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
              <FormField name="newPassword" v-slot="{ componentField }"><FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
              <FormField name="confirmPassword" v-slot="{ componentField }"><FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" v-bind="componentField" /></FormControl><FormMessage /></FormItem></FormField>
            </CardContent>
            <CardFooter class="border-t pt-6"><Button type="submit">Set New Password</Button></CardFooter>
          </Form>
        </Card>

        <Card>
            <CardHeader><CardTitle>Delete Account</CardTitle><CardDescription>Permanently delete your account.</CardDescription></CardHeader>
            <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger as-child><Button variant="destructive">Delete Account</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction @click="handleDeleteAccount">Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>