// useBeadThumbnail.tsx
import { useEffect, useMemo, useRef, useState } from 'react'

import { defaultBeadOrient } from './beadOrient'
import { buildSingleBeadMesh } from './buildBead'
import { createBeadPreviewManager } from './previewManager'

import type { BeadId } from 'src/types'

const manager = createBeadPreviewManager(buildSingleBeadMesh)

export function useBeadThumbnail(beadId: BeadId | '', size = 96) {
  const [url, setUrl] = useState<string | null>(null)
  const prevKey = useRef<string>('')

  const key = `${beadId}@${size}`
  useEffect(() => {
    let cancelled = false
    if (prevKey.current === key && url) return
    prevKey.current = key
    ;(async () => {
      const u = await manager.makeBeadThumbnail(beadId, {
        size,
        dpr: 2,
        backgroundAlpha: 1, // transparent output
        exposure: 2,
        cameraFov: 25,
        padding: 0.55,
        orient: defaultBeadOrient(beadId),
        filetype: 'image/webp',
        quality: 1,
      })
      if (!cancelled) setUrl(u)
    })()
    return () => {
      cancelled = true
    }
  }, [beadId, key, size, url])

  // Optional: expose a cleanup when unmounting the entire list
  const disposeAll = useMemo(
    () => () => {
      /* manager.dispose() */
    },
    []
  )
  return { url, disposeAll }
}
