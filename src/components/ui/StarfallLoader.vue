<script setup lang="ts">
import { computed } from 'vue';

type LoaderSize = 'sm' | 'md' | 'lg';

interface Props {
  size?: LoaderSize;
  label?: string;
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: 'Loading',
  showLabel: true
});

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'size-20',
  md: 'size-28',
  lg: 'size-36'
};

const visualClasses = computed(() => ['starfall-loader__visual', sizeClasses[props.size]]);
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="inline-flex flex-col items-center gap-4 text-accent"
  >
    <div :class="visualClasses">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle
          class="starfall-loader__ring"
          cx="50"
          cy="50"
          r="42"
        />

        <g class="starfall-loader__orbit starfall-loader__orbit--outer">
          <circle
            class="starfall-loader__arc"
            cx="50"
            cy="50"
            r="42"
          />
          <circle
            cx="50"
            cy="8"
            r="2.5"
            fill="currentColor"
          />
        </g>

        <g class="starfall-loader__orbit starfall-loader__orbit--inner">
          <circle
            class="starfall-loader__arc starfall-loader__arc--inner"
            cx="50"
            cy="50"
            r="31"
          />
          <circle
            cx="50"
            cy="19"
            r="1.5"
            fill="currentColor"
          />
        </g>

        <path
          class="starfall-loader__trail"
          d="M50 64v21"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />

        <path
          class="starfall-loader__core"
          d="m50 33 5 12 12 5-12 5-5 12-5-12-12-5 12-5 5-12Z"
          fill="currentColor"
        />
        <circle
          cx="50"
          cy="50"
          r="3"
          fill="var(--color-on-accent)"
        />
      </svg>
    </div>

    <div
      v-if="showLabel"
      class="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted"
    >
      {{ label }}
      <span
        class="inline-flex w-4 justify-start"
        aria-hidden="true"
      >
        <span class="starfall-loader__dots">...</span>
      </span>
    </div>
    <span
      v-else
      class="sr-only"
    >
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
.starfall-loader__visual {
  position: relative;
  filter: drop-shadow(0 0 0.75rem rgb(83 216 251 / 0.16));
}

.starfall-loader__visual::before {
  position: absolute;
  inset: 28%;
  z-index: -1;
  border-radius: 9999px;
  background: rgb(83 216 251 / 0.12);
  box-shadow: 0 0 2rem rgb(83 216 251 / 0.16);
  content: '';
}

.starfall-loader__ring,
.starfall-loader__arc {
  fill: none;
  stroke-width: 1.5;
}

.starfall-loader__ring {
  stroke: var(--color-line);
}

.starfall-loader__arc {
  stroke: currentColor;
  stroke-dasharray: 52 18 9 185;
  stroke-linecap: round;
}

.starfall-loader__arc--inner {
  stroke: var(--color-ink-muted);
  stroke-dasharray: 30 14 7 144;
  stroke-width: 1;
}

.starfall-loader__orbit {
  transform-box: fill-box;
  transform-origin: center;
}

.starfall-loader__orbit--outer {
  animation: starfall-orbit 3.2s linear infinite;
}

.starfall-loader__orbit--inner {
  animation: starfall-orbit-reverse 2.4s linear infinite;
}

.starfall-loader__core {
  transform-box: fill-box;
  transform-origin: center;
  animation: starfall-core 1.6s var(--ease-out-expo) infinite;
}

.starfall-loader__trail {
  stroke-dasharray: 5 7;
  animation: starfall-trail 1.2s linear infinite;
}

.starfall-loader__dots {
  display: inline-block;
  width: 0;
  overflow: hidden;
  vertical-align: bottom;
  animation: starfall-dots 1.4s steps(4, end) infinite;
}

@keyframes starfall-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes starfall-orbit-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes starfall-core {
  0%,
  100% {
    opacity: 0.72;
    transform: scale(0.9) rotate(0deg);
  }

  50% {
    opacity: 1;
    transform: scale(1.08) rotate(45deg);
  }
}

@keyframes starfall-trail {
  to {
    stroke-dashoffset: -24;
  }
}

@keyframes starfall-dots {
  to {
    width: 1rem;
  }
}
</style>
