<script setup lang="ts">
defineOptions({ name: 'MainLayout' });
</script>

<template>
  <main class="flex items-center justify-center h-full w-full">
    <div class="container">
      <slot></slot>
    </div>
  </main>
</template>
