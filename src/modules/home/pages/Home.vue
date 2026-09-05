<script setup lang="ts">
import { useRouter } from 'vue-router';

import IconStar from '@/components/icons/IconStar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';

const router = useRouter();

const features = [
  {
    number: '01',
    title: 'Forge your fleet',
    text: 'Start with a handful of basic ships, then acquire stronger vessels and permanent bases as your deck evolves.'
  },
  {
    number: '02',
    title: 'Build alliances',
    text: 'Combine cards from the same faction to activate ally abilities and turn an ordinary hand into a decisive play.'
  },
  {
    number: '03',
    title: 'Break their authority',
    text: 'Generate combat, breach enemy outposts, destroy their bases, and reduce the opposing commander to zero.'
  }
] as const;

const openPage = (name: 'games' | 'rules') => router.push({ name });
</script>

<template>
  <div class="relative isolate w-full overflow-hidden pb-20">
    <section class="grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
      <div class="max-w-3xl">
        <div
          class="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/60 px-3 py-1.5 font-mono text-xs uppercase text-accent"
        >
          <span class="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
          Tactical deckbuilding online
        </div>

        <h1 class="font-display text-5xl font-semibold text-ink sm:text-6xl xl:text-7xl">
          Build your fleet.<br />
          <span class="text-accent">Command the stars.</span>
        </h1>

        <p class="mt-7 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
          Starfall is a head-to-head deckbuilding game of trade, alliances, and orbital warfare. Adapt your fleet every
          turn, assemble powerful faction synergies, and collapse your rival’s last line of defense.
        </p>

        <div class="mt-9 flex flex-col gap-3 sm:flex-row">
          <AppButton
            size="lg"
            @click="openPage('games')"
          >
            Browse games →
          </AppButton>

          <AppButton
            variant="secondary"
            size="lg"
            @click="openPage('rules')"
          >
            Read the rules
          </AppButton>
        </div>

        <dl class="game-characteristics mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
          <div>
            <dt>Format</dt>
            <dd>1 vs 1</dd>
          </div>
          <div>
            <dt>Core</dt>
            <dd>Deckbuilding</dd>
          </div>
          <div>
            <dt>Pace</dt>
            <dd>Turn-based</dd>
          </div>
        </dl>
      </div>

      <div
        class="relative mx-auto grid aspect-square w-full max-w-136 place-items-center"
        aria-hidden="true"
      >
        <div class="home-orbit home-orbit--outer absolute inset-[5%] rounded-full border border-line" />
        <div class="home-orbit home-orbit--middle absolute inset-[17%] rounded-full border border-line/80" />
        <div class="home-orbit home-orbit--inner absolute inset-[29%] rounded-full border border-accent/25" />

        <div class="absolute inset-[35%] rounded-full bg-accent/10 blur-2xl" />
        <div
          class="relative grid size-28 place-items-center rounded-full border border-accent/35 bg-surface shadow-[0_0_80px_rgb(83_216_251/0.2)] sm:size-36"
        >
          <IconStar class="size-14 text-accent sm:size-20" />
        </div>
      </div>
    </section>

    <section class="border-t border-line py-16 sm:py-20">
      <div class="mb-10 max-w-2xl">
        <p class="font-mono text-xs uppercase text-accent">One deck. Endless decisions.</p>
        <h2 class="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Every turn reshapes the battlefield
        </h2>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <AppCard
          v-for="feature in features"
          :key="feature.number"
          as="article"
          class="group"
          interactive
        >
          <span class="font-mono text-xs text-accent">// {{ feature.number }}</span>
          <h3 class="mt-8 font-display text-xl font-semibold text-ink">{{ feature.title }}</h3>
          <p class="mt-3 text-sm leading-6 text-ink-muted">{{ feature.text }}</p>
          <div class="mt-8 h-px w-10 bg-line transition-all duration-300 group-hover:w-20 group-hover:bg-accent" />
        </AppCard>
      </div>
    </section>

    <section class="py-10 sm:py-16">
      <AppCard
        variant="accent"
        padding="none"
        class="relative overflow-hidden px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between"
      >
        <div class="relative max-w-2xl">
          <p class="font-mono text-xs uppercase text-accent">Command briefing</p>
          <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Know the rules.</h2>
          <p class="mt-3 text-sm leading-6 text-ink-muted">
            Learn the complete turn sequence, card abilities, faction synergies, base combat, and the details that
            decide close matches.
          </p>
        </div>
        <AppButton
          class="relative mt-7 lg:mt-0"
          variant="secondary"
          size="lg"
          @click="openPage('rules')"
        >
          Open field manual
          <template #trailing><span aria-hidden="true">→</span></template>
        </AppButton>
      </AppCard>
    </section>
  </div>
</template>

<style scoped>
@reference '../../../assets/styles/main.css';

.home-orbit::before {
  position: absolute;
  top: 50%;
  left: -0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-accent);
  box-shadow: 0 0 1rem rgb(83 216 251 / 0.7);
  content: '';
}

.home-orbit--outer {
  animation: home-orbit 18s linear infinite;
}

.home-orbit--middle {
  animation: home-orbit-reverse 13s linear infinite;
}

.home-orbit--inner {
  animation: home-orbit 9s linear infinite;
}

@keyframes home-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes home-orbit-reverse {
  to {
    transform: rotate(-360deg);
  }
}

.game-characteristics {
  dt {
    @apply text-xs uppercase text-ink-faint;
  }

  dd {
    @apply mt-1 font-mono text-sm font-semibold text-ink;
  }
}
</style>
