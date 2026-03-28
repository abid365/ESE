<script setup>
import { onMounted, ref } from "vue";
import "plyr/dist/plyr.css";

const props = defineProps({
  videoId: {
    type: String,
    required: true,
  },
});

const playerRef = ref(null);

onMounted(async () => {
  const Plyr = (await import("plyr")).default;
  new Plyr(playerRef.value, {
    youtube: {
      noCookie: true,
      rel: 0,
    },
  });
});
</script>

<template>
  <div class="plyr-video">
    <div
      :data-plyr-provider="'youtube'"
      :data-plyr-embed-id="videoId"
      ref="playerRef"
    ></div>
  </div>
</template>

<style scoped>
.plyr-video {
  max-width: 800px;
  margin: 1rem 0;
}

.plyr-video :deep(.plyr) {
  border-radius: 8px;
  overflow: hidden;
}
</style>
