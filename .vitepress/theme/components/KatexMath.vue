<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  expression: {
    type: String,
    required: true
  },
  displayMode: {
    type: Boolean,
    default: false
  }
})

const containerRef = ref(null)

const renderLatex = () => {
  if (containerRef.value) {
    try {
      katex.render(props.expression, containerRef.value, {
        displayMode: props.displayMode,
        throwOnError: false
      })
    } catch (e) {
      containerRef.value.textContent = props.expression
    }
  }
}

onMounted(renderLatex)
watch(() => props.expression, renderLatex)
</script>

<template>
  <span ref="containerRef" :class="{ 'katex-display': displayMode }"></span>
</template>

<style scoped>
.katex-display {
  display: block;
  text-align: center;
  margin: 1em 0;
}
</style>