<script setup>
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div>
    <Navbar />

    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>