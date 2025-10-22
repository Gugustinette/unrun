import { runAsWorker } from 'synckit'
import { unrun } from '../index'

function cloneForTransfer<T>(
  value: T,
  seen = new WeakMap<object, unknown>(),
): T {
  if (typeof value === 'function') {
    throw new TypeError('[unrun] unrunSync cannot return functions')
  }

  if (value === null || typeof value !== 'object') {
    return value
  }

  const objectValue = value as unknown as object

  if (seen.has(objectValue)) {
    return seen.get(objectValue)! as T
  }

  if (Array.isArray(value)) {
    const clone: unknown[] = []
    seen.set(objectValue, clone)
    for (const item of value) {
      clone.push(cloneForTransfer(item, seen))
    }
    return clone as T
  }

  if (isModuleNamespace(value)) {
    const clone: Record<string, unknown> = Object.create(null)
    seen.set(objectValue, clone)
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const nestedValue = (value as Record<string, unknown>)[key]
      clone[key] = cloneForTransfer(nestedValue, seen)
    }
    return clone as T
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (error) {
      if (!isDataCloneError(error)) {
        throw error
      }
    }
  }

  const clone: Record<string, unknown> = {}
  seen.set(objectValue, clone)
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    clone[key] = cloneForTransfer(child, seen)
  }
  return clone as T
}

function isModuleNamespace(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }

  return Object.prototype.toString.call(value) === '[object Module]'
}

function isDataCloneError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if (!('name' in error)) {
    return false
  }

  return (error as { name: unknown }).name === 'DataCloneError'
}

runAsWorker(async (...args) => {
  const options = args[0]
  const result = await unrun(options)
  return cloneForTransfer(result)
})
