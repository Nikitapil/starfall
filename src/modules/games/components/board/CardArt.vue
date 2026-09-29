<script setup lang="ts">
defineProps<{ type: 'ship' | 'base'; outpost?: boolean }>();
</script>
<template>
  <svg
    viewBox="0 0 160 80"
    fill="none"
    class="h-20 w-full"
    aria-hidden="true"
  >
    <path
      d="M8 40H152M80 6V74"
      stroke="currentColor"
      opacity=".12"
    />
    <circle
      cx="80"
      cy="40"
      r="30"
      stroke="currentColor"
      opacity=".2"
      stroke-dasharray="3 6"
    />
    <g
      v-if="type === 'ship'"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    >
      <path
        d="M80 10L116 62L89 52L80 62L71 52L44 62Z"
        fill="currentColor"
        fill-opacity=".08"
      />
      <path d="M80 10V47M60 39L71 52M100 39L89 52M74 64V72M86 64V72" />
      <path
        d="M80 31L87 46H73Z"
        fill="currentColor"
        fill-opacity=".4"
      />
    </g>
    <g
      v-else
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    >
      <path
        d="M80 13L103 27V53L80 67L57 53V27Z"
        fill="currentColor"
        fill-opacity=".08"
      />
      <path d="M57 34H33V46H57M103 34H127V46H103M80 13V27M80 53V67" />
      <circle
        cx="80"
        cy="40"
        r="13"
      />
      <path
        v-if="outpost"
        d="M80 29L89 34V43L80 51L71 43V34Z"
        fill="currentColor"
        fill-opacity=".3"
      />
      <path
        v-else
        d="M73 40H87M80 33V47"
      />
    </g>
  </svg>
</template>
