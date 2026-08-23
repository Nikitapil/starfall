<script lang="ts" setup>
import { ref } from 'vue';

import AppForm from '@/components/forms/AppForm.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';

const form = ref({
  email: '',
  password: '',
  username: ''
});
</script>

<template>
  <AppForm class="flex h-full w-full items-center justify-center">
    <div class="grid w-full max-w-md gap-5 rounded-panel border border-line bg-surface p-6 shadow-panel">
      <div class="grid gap-1">
        <h2 class="font-display text-2xl font-semibold tracking-tight text-ink">Register</h2>
        <p class="text-sm text-ink-muted">Create an account to start playing Starfall.</p>
      </div>

      <div class="grid gap-4">
        <AppInput
          v-model="form.email"
          type="text"
          name="email"
          label="Email"
          autocomplete="email"
          placeholder="Enter your email"
          loading
        />

        <AppInput
          v-model="form.username"
          type="text"
          name="username"
          label="Username"
          autocomplete="username"
          placeholder="Enter your username"
        />

        <AppInput
          v-model="form.password"
          type="password"
          name="password"
          label="Password"
          autocomplete="new-password"
          placeholder="Enter your password"
        />

        <AppButton
          type="submit"
          block
        >
          Register
        </AppButton>
      </div>
    </div>
  </AppForm>
</template>
