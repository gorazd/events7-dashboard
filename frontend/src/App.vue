<script setup lang="ts">
import EventsList from './components/EventsList.vue'
</script>

<template>
  <div class="app">
    <a href="#main-content" class="app__skip-link">Skip to main content</a>
    <header class="app__header">
      <h1 class="app__title">Events7 Dashboard</h1>
    </header>
    <main id="main-content" class="app__main">
      <EventsList />
    </main>
  </div>
</template>

<style scoped>
.app__skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color);
  color: var(--bg-color);
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.app__skip-link:focus {
  top: 6px;
}

</style>
