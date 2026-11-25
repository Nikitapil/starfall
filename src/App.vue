<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import AppHeader from './components/layout/AppHeader.vue';
import Main from './components/layout/Main.vue';
import StarfallLoader from './components/ui/StarfallLoader.vue';
import { useApp } from './modules/app/useApp';
import Auth from './modules/auth/components/Auth.vue';
import { useAuthStore } from './modules/auth/useAuth.ts';
import { subscribeToAuthChanges } from './modules/auth/auth-sync';
import { useI18n } from '@/plugins/i18n.ts';

const { locale } = useI18n();
const route = useRoute();
const isGameRoute = computed(() => route.name === 'game');

const { healthcheck } = useApp();
const authStore = useAuthStore();
onUnmounted(subscribeToAuthChanges(() => window.location.reload()));

const isInited = ref(false);

(async () => {
  document.documentElement.lang = locale.value === 'rus' ? 'ru' : 'en';
  await healthcheck();
  await authStore.refreshAuth();
  isInited.value = true;
})();
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <div
      v-if="!isInited"
      class="flex min-h-dvh w-full items-center justify-center"
    >
      <StarfallLoader size="lg" />
    </div>

    <template v-else>
      <AppHeader v-if="authStore.user && !isGameRoute" />

      <Main
        class="flex-1"
        :immersive="!!authStore.user && isGameRoute"
      >
        <Auth v-if="!authStore.user" />
        <RouterView v-else />
      </Main>
    </template>
  </div>
</template>
