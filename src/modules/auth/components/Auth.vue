<script lang="ts" setup>
import { computed, ref } from 'vue';

import AppForm from '@/components/forms/AppForm.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';

const isSignIn = ref(true);

const formName = computed(() => (isSignIn.value ? 'Sign in' : 'Sign up'));

const formDescriptionName = computed(() => (isSignIn.value ? 'Create an account' : 'Enter into account'));

const changeModeTexts = computed(() => ({
  text: isSignIn.value ? "Don't have an account?" : 'Already have an accout?',
  btnText: isSignIn.value ? 'Sign up' : 'Sign in'
}));

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
        <h2 class="font-display text-2xl font-semibold tracking-tight text-ink">{{ formName }}</h2>
        <p class="text-sm text-ink-muted">{{ formDescriptionName }} to start playing Starfall.</p>
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
          v-if="!isSignIn"
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
          {{ formName }}
        </AppButton>

        <p class="ml-auto">
          {{ changeModeTexts.text }}
          <AppButton
            type="button"
            variant="secondary"
            class="ml-4"
            @click="isSignIn = !isSignIn"
          >
            {{ changeModeTexts.btnText }}
          </AppButton>
        </p>
      </div>
    </div>
  </AppForm>
</template>
