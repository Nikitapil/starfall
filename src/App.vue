<script setup lang="ts">
import Auth from './auth/components/Auth.vue';
import Main from './components/layout/Main.vue';
</script>

<template>
  <div class="flex flex-col h-screen">
    <Main class="flex-1">
      <Auth />
    </Main>
  </div>
</template>

<style scoped></style>
