<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { type Lang } from '@/plugins/domain.ts';
import { setLangToStorage } from '@/plugins/locale-storage.ts';
import { useI18n } from '@/plugins/i18n.ts';

const { locale, availableLocales } = useI18n({ useScope: 'global' });

const labels: Record<Lang, { short: string; name: string; tag: string }> = {
  eng: { short: 'EN', name: 'English', tag: 'en' },
  rus: { short: 'RU', name: 'Русский', tag: 'ru' }
};

const changeLang = (lang: Lang) => {
  locale.value = lang;
  setLangToStorage(lang);
};
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center gap-0.5 rounded-control border border-line bg-canvas p-0.5"
    role="group"
    aria-label="Language"
  >
    <AppButton
      v-for="lang in availableLocales"
      :key="lang"
      type="button"
      size="sm"
      :variant="locale === lang ? 'primary' : 'ghost'"
      class="min-h-7! min-w-8 rounded-md! px-2!"
      :class="{ 'underline underline-offset-4': locale === lang }"
      :aria-label="labels[lang].name"
      :aria-pressed="locale === lang"
      :title="labels[lang].name"
      :lang="labels[lang].tag"
      @click="changeLang(lang)"
    >
      {{ labels[lang].short }}
    </AppButton>
  </div>
</template>
