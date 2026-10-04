<script setup lang="ts">
import IconLogout from '@/components/icons/IconLogout.vue';
import IconStar from '@/components/icons/IconStar.vue';
import LangSwitcher from '@/components/layout/LangSwitcher.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/modules/auth/useAuth';

const authStore = useAuthStore();
</script>

<template>
  <header class="sticky top-0 z-40 flex justify-center px-4 w-full border-b border-line bg-surface/90 backdrop-blur-md">
    <div class="flex h-16 w-full items-center justify-between container">
      <RouterLink
        :to="{ name: 'home' }"
        class="inline-flex items-center gap-3"
        aria-label="Starfall"
      >
        <span
          class="grid size-9 place-items-center rounded-control border border-accent/30 bg-accent-soft text-accent shadow-glow"
          aria-hidden="true"
        >
          <IconStar class="size-5" />
        </span>

        <span class="hidden font-display text-lg font-semibold uppercase tracking-[0.16em] text-ink sm:inline">
          Starfall
        </span>
      </RouterLink>

      <div class="flex items-center gap-2 sm:gap-3">
        <LangSwitcher />
        <AppButton
          variant="ghost"
          size="sm"
          aria-label="Log out of Starfall"
          @click="authStore.logout"
        >
          <template #leading>
            <IconLogout class="size-4" />
          </template>
          Logout
        </AppButton>
      </div>
    </div>
  </header>
</template>
