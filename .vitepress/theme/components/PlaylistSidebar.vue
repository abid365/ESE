<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vitepress";

interface Lesson {
  title: string;
  link: string;
}

const props = defineProps<{
  lessons: Lesson[];
  storageKey: string;
  collapsible?: boolean;
  currentVideoIndex?: number;
}>();

const emit = defineEmits<{
  (e: 'selectVideo', link: string): void
}>()

const router = useRouter();
const route = useRoute();

const completedLessons = ref<Set<string>>(new Set());
const isCollapsed = ref(true);

const currentIndex = computed(() => {
  if (props.currentVideoIndex !== undefined && props.currentVideoIndex >= 0) {
    return props.currentVideoIndex;
  }
  const path = route.path;
  return props.lessons.findIndex(
    (l) =>
      l.link === path || l.link === path + ".html" || l.link === path + "/",
  );
});

const currentLesson = computed(() => {
  return props.lessons[currentIndex.value];
});

const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.lessons.length - 1);

const progress = computed(() => {
  if (props.lessons.length === 0) return 0;
  const completed = props.lessons.filter((l) =>
    completedLessons.value.has(l.link),
  ).length;
  return Math.round((completed / props.lessons.length) * 100);
});

const isCurrentFinished = computed(() => {
  return currentLesson.value
    ? completedLessons.value.has(currentLesson.value.link)
    : false;
});

function loadProgress() {
  try {
    const stored = localStorage.getItem(props.storageKey);
    if (stored) {
      completedLessons.value = new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(
      props.storageKey,
      JSON.stringify([...completedLessons.value]),
    );
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}

function toggleComplete() {
  if (!currentLesson.value) return;

  if (completedLessons.value.has(currentLesson.value.link)) {
    completedLessons.value.delete(currentLesson.value.link);
  } else {
    completedLessons.value.add(currentLesson.value.link);
  }
  saveProgress();
}

function goToLesson(index: number) {
  if (index >= 0 && index < props.lessons.length) {
    emit('selectVideo', props.lessons[index].link)
  }
}

onMounted(() => {
  loadProgress();
});

watch(
  () => route.path,
  () => {
    loadProgress();
  },
);
</script>

<template>
  <div class="playlist-sidebar">
    <div
      class="playlist-header"
      @click="isCollapsed = !isCollapsed"
      style="cursor: pointer"
    >
      <div class="header-row">
        <h3>Course Progress</h3>
        <span class="collapse-icon">{{ isCollapsed ? "▼" : "▲" }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ progress }}% Complete</span>
    </div>

    <div class="playlist-content" :class="{ collapsed: isCollapsed }">
      <div class="lesson-list">
        <div
          v-for="(lesson, index) in lessons"
          :key="lesson.link"
          class="lesson-item"
          :class="{
            active: index === currentIndex,
            completed: completedLessons.has(lesson.link),
          }"
          @click="goToLesson(index)"
        >
          <span class="lesson-status">
            <span v-if="completedLessons.has(lesson.link)" class="check"
              >✓</span
            >
            <span v-else class="circle">{{ index + 1 }}</span>
          </span>
          <span class="lesson-title">{{ lesson.title }}</span>
        </div>
      </div>

      <div class="playlist-controls">
        <button
          class="nav-btn prev"
          :disabled="!hasPrevious"
          @click="goToLesson(currentIndex - 1)"
        >
          ← Previous
        </button>

        <button
          class="finish-btn"
          :class="{ finished: isCurrentFinished }"
          @click="toggleComplete"
        >
          {{ isCurrentFinished ? "✓ Marked Finished" : "Mark as Finished" }}
        </button>

        <button
          class="nav-btn next"
          :disabled="!hasNext"
          @click="goToLesson(currentIndex + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-sidebar {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.playlist-header {
  margin-bottom: 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-row h3 {
  margin: 0;
}

.collapse-icon {
  font-size: 10px;
  color: var(--vp-c-text-2);
  transition: transform 0.2s ease;
}

.playlist-content {
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
}

.playlist-content.collapsed {
  max-height: 0;
  opacity: 0;
}

.playlist-header h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.progress-bar {
  height: 8px;
  background: var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--vp-c-brand);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.lesson-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.lesson-item:hover {
  background: var(--vp-c-bg-elv);
}

.lesson-item.active {
  background: var(--vp-c-brand-light);
  border: 1px solid var(--vp-c-brand);
}

.lesson-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.lesson-status .circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--vp-c-text-2);
}

.lesson-item.active .circle {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.lesson-item.completed .circle {
  display: none;
}

.lesson-status .check {
  color: var(--vp-c-brand);
  font-weight: bold;
  font-size: 14px;
}

.lesson-title {
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.lesson-item.active .lesson-title {
  font-weight: 600;
  color: var(--vp-c-brand);
}

.playlist-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.nav-btn {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: var(--vp-c-bg-elv);
  border-color: var(--vp-c-text-2);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.finish-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand);
  background: transparent;
  color: var(--vp-c-brand);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 160px;
}

.finish-btn:hover {
  background: var(--vp-c-brand-light);
}

.finish-btn.finished {
  background: var(--vp-c-brand);
  color: white;
}
</style>
