<script setup>
import { ref, computed, onMounted } from 'vue'
import KatexMath from './KatexMath.vue'

const props = defineProps({
  storageKey: { type: String, required: true },
  items: { type: Array, required: true }
})

const checked = ref(new Set())

onMounted(() => {
  const saved = localStorage.getItem(props.storageKey)
  if (saved) checked.value = new Set(JSON.parse(saved))
})

const toggle = (id) => {
  if (checked.value.has(id)) checked.value.delete(id)
  else checked.value.add(id)
  localStorage.setItem(props.storageKey, JSON.stringify([...checked.value]))
}

const progress = computed(() => Math.round((checked.value.size / props.items.length) * 100))

const parseLabel = (label) => {
  const parts = []
  const regex = /\/(.*?)\//g
  let lastIndex = 0
  let match

  while ((match = regex.exec(label)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: label.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'latex', content: match[1] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < label.length) {
    parts.push({ type: 'text', content: label.slice(lastIndex) })
  }

  return parts
}
</script>

<template>
  <div class="self-check-list">
    <div class="progress-header">
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ progress }}% complete</span>
    </div>
    <div class="checklist-items">
      <label v-for="item in items" :key="item.id" class="checklist-item">
        <input 
          type="checkbox" 
          :checked="checked.has(item.id)" 
          @change="toggle(item.id)"
        />
        <span class="item-content">
          <template v-for="(part, index) in parseLabel(item.label)" :key="index">
            <KatexMath v-if="part.type === 'latex'" :expression="part.content" :displayMode="false" />
            <span v-else>{{ part.content }}</span>
          </template>
        </span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.self-check-list {
  margin: 1rem 0;
}
.progress-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.progress-bar-container {
  flex: 1;
  height: 8px;
  background: var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  min-width: 60px;
}
.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.5rem 0;
  cursor: pointer;
}
.checklist-item input {
  margin-top: 0.25rem;
}
.item-content {
  line-height: 1.6;
}
</style>