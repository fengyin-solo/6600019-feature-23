<template>
  <div class="flex h-screen relative">
    <!-- Upload Toast -->
    <Transition name="toast">
      <div v-if="store.showUploadToast" class="fixed top-4 right-4 z-50 min-w-72" @click="store.clearUploadToast()">
        <div :class="[
          'rounded-lg shadow-lg p-4 flex items-center gap-3',
          store.uploadStatus === 'uploading' ? 'bg-blue-900 border border-blue-500' : '',
          store.uploadStatus === 'processing' ? 'bg-yellow-900 border border-yellow-500' : '',
          store.uploadStatus === 'success' ? 'bg-green-900 border border-green-500' : '',
          store.uploadStatus === 'error' ? 'bg-red-900 border border-red-500' : ''
        ]">
          <span class="text-xl">
            <span v-if="store.uploadStatus === 'uploading'">⬆️</span>
            <span v-else-if="store.uploadStatus === 'processing'">⚙️</span>
            <span v-else-if="store.uploadStatus === 'success'">✅</span>
            <span v-else-if="store.uploadStatus === 'error'">❌</span>
          </span>
          <div class="flex-1">
            <div class="font-medium text-white text-sm">
              {{ statusText }}
            </div>
            <div v-if="store.uploadErrorMessage" class="text-xs text-gray-300 mt-1">
              {{ store.uploadErrorMessage }}
            </div>
          </div>
          <button class="text-gray-400 hover:text-white text-sm ml-2">✕</button>
        </div>
      </div>
    </Transition>

    <!-- Sidebar -->
    <div class="w-72 bg-gray-900 p-4 flex flex-col gap-3 border-r border-gray-800 overflow-y-auto">
      <h1 class="text-lg font-bold text-cyan-400">地震波形 P/S 波分析</h1>

      <div>
        <label :class="[
          'block text-center py-2 rounded cursor-pointer text-sm font-medium transition-colors',
          store.uploadStatus === 'uploading' || store.uploadStatus === 'processing'
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-cyan-500 text-black hover:bg-cyan-400'
        ]">
          <span v-if="store.uploadStatus === 'uploading'">⬆️ 上传中...</span>
          <span v-else-if="store.uploadStatus === 'processing'">⚙️ 处理中...</span>
          <span v-else>📁 上传 SAC/miniSEED</span>
          <input
            type="file"
            @change="onUpload"
            class="hidden"
            :disabled="store.uploadStatus === 'uploading' || store.uploadStatus === 'processing'"
          />
        </label>
      </div>
      <button
        @click="store.loadMockData()"
        :disabled="store.uploadStatus === 'uploading' || store.uploadStatus === 'processing'"
        :class="[
          'py-2 rounded text-sm transition-colors',
          store.uploadStatus === 'uploading' || store.uploadStatus === 'processing'
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-gray-800 hover:bg-gray-700'
        ]">
        加载模拟数据
      </button>

      <!-- Upload History -->
      <div v-if="store.uploadHistory.length > 0" class="bg-gray-800 rounded-xl p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-cyan-300 font-bold text-sm">最近上传</h3>
          <button
            @click="showHistoryPanel = !showHistoryPanel"
            class="text-xs text-gray-400 hover:text-white">
            {{ showHistoryPanel ? '收起' : `查看全部 (${store.uploadHistory.length})` }}
          </button>
        </div>
        <div v-if="!showHistoryPanel && store.uploadHistory.length > 0"
             @click="store.loadHistoryItem(store.uploadHistory[0])"
             class="bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-600 transition-colors">
          <div class="flex items-center justify-between">
            <span class="text-sm truncate flex-1">{{ store.uploadHistory[0].fileName }}</span>
            <span :class="[
              'text-xs ml-2 px-1.5 py-0.5 rounded',
              store.uploadHistory[0].status === 'success' ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'
            ]">
              {{ store.uploadHistory[0].status === 'success' ? '成功' : '失败' }}
            </span>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            {{ formatTime(store.uploadHistory[0].uploadTime) }} · {{ formatFileSize(store.uploadHistory[0].fileSize) }}
          </div>
        </div>
        <Transition name="slide">
          <div v-if="showHistoryPanel" class="space-y-1 max-h-48 overflow-y-auto">
            <div
              v-for="item in store.uploadHistory"
              :key="item.id"
              @click="store.loadHistoryItem(item)"
              class="bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-sm truncate flex-1">{{ item.fileName }}</span>
                <span :class="[
                  'text-xs ml-2 px-1.5 py-0.5 rounded whitespace-nowrap',
                  item.status === 'success' ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'
                ]">
                  {{ item.status === 'success' ? '成功' : '失败' }}
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-1 flex justify-between">
                <span>{{ formatTime(item.uploadTime) }}</span>
                <span>{{ formatFileSize(item.fileSize) }}</span>
              </div>
              <div v-if="item.picksCount" class="text-xs text-cyan-400 mt-1">
                拾取 {{ item.picksCount }} 个震相
              </div>
              <div v-if="item.errorMessage" class="text-xs text-red-400 mt-1 truncate">
                {{ item.errorMessage }}
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- STA/LTA Parameters -->
      <div class="bg-gray-800 rounded-xl p-3 space-y-2">
        <h3 class="text-cyan-300 font-bold text-sm">STA/LTA 参数</h3>
        <div>
          <label class="text-gray-400 text-xs">STA 窗口: {{ store.staWindow.toFixed(1) }}s</label>
          <input type="range" v-model.number="store.staWindow" min="0.5" max="5" step="0.1" class="w-full" />
        </div>
        <div>
          <label class="text-gray-400 text-xs">LTA 窗口: {{ store.ltaWindow.toFixed(1) }}s</label>
          <input type="range" v-model.number="store.ltaWindow" min="5" max="30" step="0.5" class="w-full" />
        </div>
        <div>
          <label class="text-gray-400 text-xs">触发阈值: {{ store.threshold.toFixed(1) }}</label>
          <input type="range" v-model.number="store.threshold" min="1" max="10" step="0.5" class="w-full" />
        </div>
        <button @click="runPick" class="w-full bg-cyan-600 py-2 rounded text-sm hover:bg-cyan-500">
          运行自动拾取
        </button>
      </div>

      <!-- Picks -->
      <div class="bg-gray-800 rounded-xl p-3">
        <h3 class="text-cyan-300 font-bold text-sm mb-2">震相拾取结果</h3>
        <div v-for="p in store.picks" :key="p.id" class="flex justify-between bg-gray-700 rounded p-2 mb-1 text-sm">
          <span :class="p.type === 'P' ? 'text-red-400' : 'text-blue-400'">{{ p.type }} 波</span>
          <span>{{ p.time.toFixed(2) }}s</span>
          <span class="text-gray-400">{{ (p.confidence * 100).toFixed(0) }}%</span>
        </div>
        <div v-if="!store.picks.length" class="text-gray-600 text-xs">加载数据后运行拾取</div>
      </div>

      <!-- Stations -->
      <div class="bg-gray-800 rounded-xl p-3">
        <h3 class="text-cyan-300 font-bold text-sm mb-2">台站分布</h3>
        <div v-for="s in store.stations" :key="s.id"
          @click="store.selectedStation = s"
          class="bg-gray-700 rounded p-2 mb-1 text-sm cursor-pointer hover:bg-gray-600"
          :class="store.selectedStation?.id === s.id ? 'ring-1 ring-cyan-500' : ''">
          {{ s.name }} <span class="text-gray-400 text-xs">({{ s.latitude.toFixed(1) }}, {{ s.longitude.toFixed(1) }})</span>
        </div>
      </div>

      <!-- Events -->
      <div class="bg-gray-800 rounded-xl p-3">
        <h3 class="text-cyan-300 font-bold text-sm mb-2">地震事件目录</h3>
        <div v-for="e in store.events" :key="e.id" class="bg-gray-700 rounded p-2 mb-1 text-xs">
          M{{ e.magnitude }} {{ e.location }}
          <div class="text-gray-500">深度 {{ e.depth }}km | {{ e.originTime.slice(0, 16) }}</div>
        </div>
      </div>
    </div>

    <!-- Main: Waveform Charts -->
    <div class="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
      <WaveformChart v-if="store.waveform" />
      <div v-else class="flex-1 flex items-center justify-center text-gray-600">
        请上传数据或加载模拟波形
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSeismicStore } from './store/seismic'
import WaveformChart from './components/WaveformChart.vue'

const store = useSeismicStore()
const showHistoryPanel = ref(false)

const statusText = computed(() => {
  switch (store.uploadStatus) {
    case 'uploading': return '正在上传文件...'
    case 'processing': return '正在分析波形数据...'
    case 'success': return '上传成功！'
    case 'error': return '上传失败'
    default: return ''
  }
})

watch(() => store.uploadStatus, (newStatus) => {
  if (newStatus === 'success' || newStatus === 'error') {
    const timer = setTimeout(() => {
      store.clearUploadToast()
    }, 5000)
    return () => clearTimeout(timer)
  }
})

function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) store.uploadAndAnalyze(file)
  ;(e.target as HTMLInputElement).value = ''
}

function runPick() {
  store.picks = store.staLtaPicking()
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
