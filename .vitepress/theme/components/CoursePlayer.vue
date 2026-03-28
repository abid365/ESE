<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PlaylistSidebar from './PlaylistSidebar.vue'

interface Lesson {
  title: string
  link: string
}

const props = defineProps<{
  videoSrc: string
  storageKey: string
  lessons: Lesson[]
}>()

const emit = defineEmits<{
  (e: 'videoChange', videoSrc: string): void
}>()

const currentVideoSrc = ref(props.videoSrc)

function handleVideoSelect(link: string) {
  currentVideoSrc.value = link
  emit('videoChange', link)
}

const currentVideoIndex = computed(() => {
  const idx = props.lessons.findIndex(l => l.link === currentVideoSrc.value)
  return idx >= 0 ? idx : 0
})

const isYouTube = computed(() => {
  return currentVideoSrc.value.includes('youtube.com') || currentVideoSrc.value.includes('youtu.be')
})

const youtubeVideoId = computed(() => {
  if (!isYouTube.value) return ''
  const url = currentVideoSrc.value
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : ''
})

const youtubeEmbedUrl = computed(() => {
  if (!youtubeVideoId.value) return ''
  return `https://www.youtube.com/embed/${youtubeVideoId.value}?rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`
})

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
const hideControlsTimeout = ref<number | null>(null)
const playerReady = ref(false)

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const progressPercent = computed(() => {
  if (!duration.value || !currentTime.value) return 0
  return (currentTime.value / duration.value) * 100
})

function togglePlay() {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

function handleTimeUpdate() {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

function handleLoadedMetadata() {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

function handlePlay() {
  isPlaying.value = true
}

function handlePause() {
  isPlaying.value = false
}

function handleEnded() {
  isPlaying.value = false
}

function seek(event: MouseEvent) {
  if (!videoRef.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  videoRef.value.currentTime = percent * duration.value
}

function handleVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  volume.value = parseFloat(target.value)
  if (videoRef.value) {
    videoRef.value.volume = volume.value
    isMuted.value = volume.value === 0
  }
}

function toggleMute() {
  if (!videoRef.value) return
  if (isMuted.value) {
    videoRef.value.muted = false
    isMuted.value = false
  } else {
    videoRef.value.muted = true
    isMuted.value = true
  }
}

function toggleFullscreen() {
  const container = document.querySelector('.video-container') as HTMLElement
  if (!container) return

  if (!document.fullscreenElement) {
    container.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function handleMouseMove() {
  showControls.value = true
  if (hideControlsTimeout.value) {
    clearTimeout(hideControlsTimeout.value)
  }
  if (isPlaying.value) {
    hideControlsTimeout.value = window.setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

function handleMouseLeave() {
  if (isPlaying.value) {
    hideControlsTimeout.value = window.setTimeout(() => {
      showControls.value = false
    }, 1000)
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (hideControlsTimeout.value) {
    clearTimeout(hideControlsTimeout.value)
  }
})
</script>

<template>
  <div class="course-player" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <div class="video-container">
      <template v-if="isYouTube && youtubeEmbedUrl">
        <iframe
          :key="youtubeVideoId"
          :src="youtubeEmbedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </template>
      <template v-else>
        <video
          ref="videoRef"
          :src="currentVideoSrc"
          @timeupdate="handleTimeUpdate"
          @loadedmetadata="handleLoadedMetadata"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleEnded"
          @click="togglePlay"
        ></video>

        <div class="controls" :class="{ visible: showControls }">
          <div class="progress-container" @click="seek">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
          </div>

          <div class="controls-row">
            <div class="controls-left">
              <button class="control-btn" @click="togglePlay">
                <span v-if="isPlaying">⏸</span>
                <span v-else>▶</span>
              </button>

              <div class="time-display">
                {{ formattedCurrentTime }} / {{ formattedDuration }}
              </div>

              <div class="volume-control">
                <button class="control-btn" @click="toggleMute">
                  <span v-if="isMuted || volume === 0">🔇</span>
                  <span v-else>🔊</span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  :value="isMuted ? 0 : volume"
                  @input="handleVolumeChange"
                  class="volume-slider"
                />
              </div>
            </div>

            <div class="controls-right">
              <button class="control-btn" @click="toggleFullscreen">
                <span v-if="isFullscreen">⛶</span>
                <span v-else>⛶</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <PlaylistSidebar :lessons="lessons" :storageKey="storageKey" :collapsible="true" :currentVideoIndex="currentVideoIndex" @selectVideo="handleVideoSelect" />
  </div>
</template>

<style scoped>
.course-player {
  margin: 24px 0;
}

.video-container {
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.controls.visible {
  opacity: 1;
}

.progress-container {
  cursor: pointer;
  padding: 8px 0;
}

.progress-bar-bg {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-container:hover .progress-bar-bg {
  height: 6px;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controls-right {
  display: flex;
  align-items: center;
}

.control-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.time-display {
  color: #fff;
  font-size: 13px;
  font-family: monospace;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>