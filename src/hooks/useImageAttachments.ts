'use client'

import { useState, useRef, useEffect } from 'react'

export interface AttachedFile {
  file: File
  previewUrl: string
}

export function useImageAttachments() {
  const [attached, setAttached] = useState<AttachedFile[]>([])
  const attachedRef = useRef<AttachedFile[]>([])

  useEffect(() => {
    attachedRef.current = attached
  }, [attached])

  // Revoke all blob URLs on unmount to free memory
  useEffect(() => {
    return () => {
      for (const item of attachedRef.current) URL.revokeObjectURL(item.previewUrl)
    }
  }, [])

  const add = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return
    const newItems = images.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setAttached((prev) => [...prev, ...newItems])
  }

  const remove = (index: number) => {
    setAttached((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const clear = () => {
    for (const item of attachedRef.current) URL.revokeObjectURL(item.previewUrl)
    setAttached([])
  }

  return { attached, add, remove, clear }
}
