<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

// --- Page Meta and Breadcrumbs ---
useHead({
  title: 'User Profile - EnderDeploy',
});

// --- Validation Schemas ---
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

// --- Mock Data & State ---
const user = ref({
  username: 'DemoUser',
  email: 'demo@example.com',
  avatar: 'https://github.com/radix-vue.png',
});

// --- Form Handlers ---
function onProfileSubmit(values: any) {
  console.log('Profile updated:', values);
  // Here you would typically call an API to save the user's details.
}

function onPasswordSubmit(values: any) {
  console.log('Password change requested:', values);
  // API call to change password.
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
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
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
              <div class="flex items-center gap-4">
                <Avatar class="size-16">
                  <AvatarImage :src="user.avatar" alt="User Avatar" />
                  <AvatarFallback>{{ user.username?.substring(0, 2).toUpperCase() }}</AvatarFallback>
                </Avatar>
              </div>
              <FormField name="username" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="email" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" v-bind="componentField" />
                  </FormControl>
                  <FormDescription>Used for notifications and password recovery.</FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
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
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password for better security. Choose a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <FormField name="currentPassword" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="newPassword" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="confirmPassword" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
            <CardFooter class="border-t pt-6">
              <Button type="submit">Set New Password</Button>
            </CardFooter>
          </Form>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger as-child>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>