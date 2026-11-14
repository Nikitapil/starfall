<script setup lang="ts">
defineProps<{ kind: 'trade' | 'combat' | 'authority' | 'defense' | 'deck' | 'hand' | 'discard' }>();
</script>
<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'trade'">
      <circle
        cx="12"
        cy="12"
        r="8"
      />
      <path d="M12 7V17M9 9H14L15 12H9L10 15H15" />
    </template>
    <template v-else-if="kind === 'combat'">
      <circle
        cx="12"
        cy="12"
        r="7"
      />
      <path d="M12 2V7M12 17V22M2 12H7M17 12H22M10 14L14 10" />
    </template>
    <template v-else-if="kind === 'authority' || kind === 'defense'">
      <path d="M12 3L20 6V12C20 16 16 19 12 22C8 19 4 16 4 12V6Z" />
      <path
        v-if="kind === 'authority'"
        d="M8 12H16M12 8V16"
      />
      <path
        v-else
        d="M9 12L11 14L16 9"
      />
    </template>
    <template v-else-if="kind === 'deck'">
      <path d="M5 6V3H19V18H16M2 6H16V21H2Z" />
      <path d="M6 10H12M6 14H12" />
    </template>
    <template v-else-if="kind === 'hand'"><path d="M8 4H16V19H8ZM8 7L3 9L7 21L10 20M16 7L21 9L17 21L14 20" /></template>
    <template v-else><path d="M5 8H17V21H5ZM8 4H20V17M9 12L13 16M13 12L9 16" /></template>
  </svg>
</template>
