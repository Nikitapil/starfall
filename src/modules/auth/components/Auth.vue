<script lang="ts" setup>
import { computed, ref } from 'vue';

import AppForm from '@/components/forms/AppForm.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useAuthStore } from '../useAuth';
import { useForm } from 'vee-validate';

const store = useAuthStore();

const { validate } = useForm();

const isSignIn = ref(true);
const error = ref('');

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

const onSubmit = async () => {
  const { valid } = await validate();

  if (!valid) {
    return;
  }

  if (isSignIn.value) {
    const { success } = await store.signin(form.value);
    if (!success) {
      error.value = 'Wrong email or password';
    }
  } else {
    const { error: responseError } = await store.signup(form.value);
    if (
      responseError &&
      typeof responseError === 'object' &&
      'message' in responseError &&
      Array.isArray(responseError.message)
    ) {
      error.value = responseError.message[0];
    }
  }
};

const toggleMode = () => {
  error.value = '';
  isSignIn.value = !isSignIn.value;
};
</script>

<template>
  <AppForm
    class="flex h-full w-full items-center justify-center"
    @submit="onSubmit"
  >
    <AppCard
      variant="panel"
      class="grid w-full max-w-md gap-5"
    >
      <div class="grid gap-1">
        <h2 class="font-display text-2xl font-semibold tracking-tight text-ink">{{ formName }}</h2>
        <p class="text-sm text-ink-muted">{{ formDescriptionName }} to start playing Starfall.</p>
      </div>

      <p
        v-if="error"
        class="text-xs text-danger"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="grid gap-4">
        <AppInput
          v-model="form.email"
          type="text"
          name="email"
          label="Email"
          validationName="Email"
          autocomplete="email"
          placeholder="Enter your email"
          rules="required|email"
          :loading="store.isAuthLoading"
        />

        <AppInput
          v-if="!isSignIn"
          v-model="form.username"
          type="text"
          name="username"
          label="Username"
          validationName="Username"
          autocomplete="username"
          placeholder="Enter your username"
          rules="required"
          :loading="store.isAuthLoading"
        />

        <AppInput
          v-model="form.password"
          type="password"
          name="password"
          label="Password"
          validationName="Password"
          autocomplete="new-password"
          placeholder="Enter your password"
          rules="required"
          :loading="store.isAuthLoading"
        />

        <AppButton
          :loading="store.isAuthLoading"
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
            :disabled="store.isAuthLoading"
            @click="toggleMode"
          >
            {{ changeModeTexts.btnText }}
          </AppButton>
        </p>
      </div>
    </AppCard>
  </AppForm>
</template>
