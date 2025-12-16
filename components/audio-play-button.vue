<!-- 按钮播放器 -->
<template>
  <div class="relative">
    <el-progress type="circle" :width="50" :percentage="audioPlayedPercentage" striped-flow>
      <template #default>
        <img
          class="cursor-pointer absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10"
          :src="isPlaying ? PauseFilledSVG : PlayFilledSVG"
          @click="toggleAudioPlay"
        />
      </template>
    </el-progress>
  </div>
</template>

<script setup lang="ts">
  import PlayFilledSVG from '~/assets/icons/play-filled.svg'
  import PauseFilledSVG from '~/assets/icons/pause-filled.svg'

  const props = defineProps<{
    audio: Blob | string
    autoplay?: boolean
  }>()

  let audio: InstanceType<typeof Audio>
  const audioPlayedPercentage = ref(0)
  const isPlaying = ref(false)

  function toggleAudioPlay() {
    if (audio.paused) {
      audio.play()
      isPlaying.value = true
    } else {
      audio.pause()
      audio.currentTime = 0
      audioPlayedPercentage.value = 0
      isPlaying.value = false
    }
  }

  watch(
    () => props.audio,
    () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        audioPlayedPercentage.value = 0
        isPlaying.value = false
      }
      if (!props.audio) throw new Error('props.audio is required')
      audio = new Audio(
        typeof props.audio === 'string' ? props.audio : URL.createObjectURL(props.audio),
      )
      audio.addEventListener('timeupdate', () => {
        audioPlayedPercentage.value = (audio.currentTime / audio.duration) * 100
      })
      audio.addEventListener('ended', () => {
        isPlaying.value = false
      })
      if (props.autoplay) toggleAudioPlay()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    audio.pause()
  })
</script>
