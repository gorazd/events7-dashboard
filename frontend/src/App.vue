<script setup lang="ts">
import EventsList from './components/EventsList.vue'
</script>

<template>
  <div id="app">
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <header>
      <h1>Events Dashboard</h1>
    </header>
    <main id="main-content">
      <EventsList />
    </main>
  </div>
</template>

<style scoped>
.skip-to-content {
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

.skip-to-content:focus {
  top: 6px;
}
</style>
