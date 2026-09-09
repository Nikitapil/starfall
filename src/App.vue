<script setup lang="ts">
import { onUnmounted, ref } from 'vue';

import AppHeader from './components/layout/AppHeader.vue';
import Main from './components/layout/Main.vue';
import StarfallLoader from './components/ui/StarfallLoader.vue';
import Auth from './modules/auth/components/Auth.vue';
import { useAuthStore } from './modules/auth/useAuth.ts';
import { subscribeToAuthChanges } from './modules/auth/auth-sync';

const authStore = useAuthStore();
onUnmounted(subscribeToAuthChanges(() => window.location.reload()));

const isInited = ref(false);

(async () => {
  await authStore.refreshAuth();
  isInited.value = true;
})();
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div
      v-if="!isInited"
      class="flex min-h-screen w-full items-center justify-center"
    >
      <StarfallLoader size="lg" />
    </div>

    <template v-else>
      <AppHeader v-if="authStore.user" />

      <Main class="flex-1">
        <Auth v-if="!authStore.user" />
        <RouterView v-else />
      </Main>
    </template>
  </div>
</template>
