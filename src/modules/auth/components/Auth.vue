<script lang="ts" setup>
import { computed, ref } from 'vue';

import AppForm from '@/components/forms/AppForm.vue';
import LangSwitcher from '@/components/layout/LangSwitcher.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useAuthStore } from '../useAuth';
import { useForm } from 'vee-validate';
import { useI18n } from '@/plugins/i18n.ts';

const { t } = useI18n();

const store = useAuthStore();

const { validate } = useForm();

const isSignIn = ref(true);
const isCredentialsError = ref(false);
const serverError = ref('');
const error = computed(() => serverError.value || (isCredentialsError.value ? t('auth.wrongCredentials') : ''));

const formName = computed(() => t(isSignIn.value ? 'auth.signIn' : 'auth.signUp'));

const formDescriptionName = computed(() => t(isSignIn.value ? 'auth.signInDescription' : 'auth.signUpDescription'));

const changeModeTexts = computed(() => ({
  text: t(isSignIn.value ? 'auth.noAccount' : 'auth.hasAccount'),
  btnText: t(isSignIn.value ? 'auth.signUp' : 'auth.signIn')
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
      isCredentialsError.value = true;
    }
  } else {
    const { error: responseError } = await store.signup(form.value);
    if (
      responseError &&
      typeof responseError === 'object' &&
      'message' in responseError &&
      Array.isArray(responseError.message)
    ) {
      serverError.value = typeof responseError.message[0] === 'string' ? responseError.message[0] : '';
    }
  }
};

const toggleMode = () => {
  isCredentialsError.value = false;
  serverError.value = '';
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
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-display text-2xl font-semibold tracking-tight text-ink">{{ formName }}</h2>
          <LangSwitcher />
        </div>
        <p class="text-sm text-ink-muted">{{ formDescriptionName }}</p>
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
          :label="t('auth.email')"
          :validationName="t('auth.email')"
          autocomplete="email"
          :placeholder="t('auth.emailPlaceholder')"
          rules="required|email"
          :loading="store.isAuthLoading"
        />

        <AppInput
          v-if="!isSignIn"
          v-model="form.username"
          type="text"
          name="username"
          :label="t('auth.username')"
          :validationName="t('auth.username')"
          autocomplete="username"
          :placeholder="t('auth.usernamePlaceholder')"
          rules="required"
          :loading="store.isAuthLoading"
        />

        <AppInput
          v-model="form.password"
          type="password"
          name="password"
          :label="t('auth.password')"
          :validationName="t('auth.password')"
          autocomplete="new-password"
          :placeholder="t('auth.passwordPlaceholder')"
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

        <p class="flex flex-wrap items-center justify-end gap-3 text-sm">
          {{ changeModeTexts.text }}
          <AppButton
            type="button"
            variant="secondary"
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
