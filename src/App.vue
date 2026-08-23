<script setup lang="ts">
import Auth from './modules/auth/components/Auth.vue';
import Main from './components/layout/Main.vue';
import { ref } from 'vue';
import StarfallLoader from './components/ui/StarfallLoader.vue';
import { useAuthStore } from './modules/auth/useAuth.ts';

const { user, refreshAuth } = useAuthStore();

const isInited = ref(false);

(async () => {
  await refreshAuth();
  isInited.value = true;
})();
</script>

<template>
  <div class="flex flex-col h-screen">
    <div
      v-if="!isInited"
      class="w-full h-full flex items-center justify-center"
    >
      <StarfallLoader size="lg" />
    </div>

    <Main
      v-else
      class="flex-1"
    >
      <Auth v-if="!user" />
    </Main>
  </div>
</template>
