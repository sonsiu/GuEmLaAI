'use client'

class InMemoryStorage {
  private data: Record<string, string> = {}

  setItem(key: string, value: string) {
    this.data[key] = value
  }

  getItem(key: string) {
    return this.data[key] || null
  }

  removeItem(key: string) {
    delete this.data[key]
  }
}

class StorageService {
  private prefix = 'opx_toptop'
  private local: Storage | InMemoryStorage

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.local = window.localStorage
    } else {
      this.local = new InMemoryStorage()
    }
  }

  private genKey(key: string) {
    return `${this.prefix}_${key}`
  }

  set<T = unknown>(key: string, data: T) {
    const value = JSON.stringify(data)

    this.local.setItem(this.genKey(key), value)
  }

  get<T = unknown>(key: string): T | null {
    const value = this.local.getItem(this.genKey(key))

    try {
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  remove(key: string) {
    this.local.removeItem(this.genKey(key))
  }

  setSession<T = unknown>(key: string, data: T) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.genKey(key), JSON.stringify(data))
    }
  }

  getSession<T = unknown>(key: string): T | null {
    if (typeof window !== 'undefined') {
      const value = sessionStorage.getItem(this.genKey(key))

      try {
        return value ? JSON.parse(value) : null
      } catch {
        return null
      }
    }

    return null
  }

  removeSession(key: string) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.genKey(key))
    }
  }
}

export const storageService = new StorageService()
