<script setup lang="ts">
defineProps<{ immersive?: boolean }>();
</script>

<template>
  <main
    class="flex justify-center h-full w-full"
    :class="immersive ? 'min-w-0' : 'px-4'"
  >
    <div
      class="min-w-0"
      :class="immersive ? 'w-full' : 'container'"
    >
      <slot></slot>
    </div>
  </main>
</template>
