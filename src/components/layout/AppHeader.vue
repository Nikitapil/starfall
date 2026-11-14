<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import IconLogout from '@/components/icons/IconLogout.vue';
import IconStar from '@/components/icons/IconStar.vue';
import LangSwitcher from '@/components/layout/LangSwitcher.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/modules/auth/useAuth';

const authStore = useAuthStore();

const { t } = useI18n();
</script>

<template>
  <header class="sticky top-0 z-40 flex justify-center px-4 w-full border-b border-line bg-surface/90 backdrop-blur-md">
    <div class="flex min-h-16 w-full flex-wrap items-center justify-between gap-2 py-2 container">
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

      <div class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <LangSwitcher />
        <AppButton
          variant="ghost"
          size="sm"
          :aria-label="t('common.logoutLabel')"
          @click="authStore.logout"
        >
          <template #leading>
            <IconLogout class="size-4" />
          </template>
          {{ t('common.logout') }}
        </AppButton>
      </div>
    </div>
  </header>
</template>
