export type StorageUsage = {
  usage: number
  quota: number
}

export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.storage?.persist !== 'function') {
    return false
  }
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageUsage(): Promise<StorageUsage | null> {
  if (typeof navigator === 'undefined' || typeof navigator.storage?.estimate !== 'function') {
    return null
  }
  try {
    const { usage, quota } = await navigator.storage.estimate()
    if (typeof usage === 'number' && typeof quota === 'number') {
      return { usage, quota }
    }
    return null
  } catch {
    return null
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const digits = exponent === 0 || Number.isInteger(value) ? 0 : 1
  return `${value.toFixed(digits)} ${units[exponent]}`
}
