import type { AxiosRequestConfig } from 'axios'
import { apiClient } from './client'

interface QueuedRequest {
  config: AxiosRequestConfig
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}

const queue: QueuedRequest[] = []
let isProcessing = false

export async function enqueueRequest<T>(config: AxiosRequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push({ config, resolve: resolve as (v: unknown) => void, reject })
    processQueue()
  })
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return
  isProcessing = true

  while (queue.length > 0) {
    const item = queue.shift()!
    try {
      const response = await apiClient.request(item.config)
      item.resolve(response.data)
    } catch (error) {
      item.reject(error)
    }
  }

  isProcessing = false
}
