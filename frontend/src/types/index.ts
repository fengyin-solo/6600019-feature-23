export interface WaveformData {
  time: number[]
  bhz: number[]  // vertical component
  bhn: number[]  // north component
  bhe: number[]  // east component
  samplingRate: number
}

export interface PhasePick {
  id: string
  type: 'P' | 'S'
  time: number
  confidence: number
  method: string
}

export interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  elevation: number
}

export interface SeismicEvent {
  id: string
  magnitude: number
  depth: number
  originTime: string
  location: string
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export interface UploadHistoryItem {
  id: string
  fileName: string
  fileSize: number
  uploadTime: string
  status: UploadStatus
  errorMessage?: string
  stationName?: string
  picksCount?: number
}
