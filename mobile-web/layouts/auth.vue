<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #3587dc 0%, #1a5fa8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
