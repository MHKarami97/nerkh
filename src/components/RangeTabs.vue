<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true }, // [{ key, label }]
});
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="range-tabs range-tabs--scroll" role="group" aria-label="بازه زمانی">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      class="range-tabs__btn"
      :class="{ 'is-active': modelValue === option.key }"
      :aria-pressed="modelValue === option.key"
      @click="$emit('update:modelValue', option.key)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.range-tabs--scroll {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.range-tabs--scroll::-webkit-scrollbar {
  display: none;
}

.range-tabs__btn {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
