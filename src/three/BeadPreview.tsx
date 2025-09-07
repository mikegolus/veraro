// BeadPreview.tsx
import { useEffect, useRef, useState } from 'react'

import { useBeadThumbnail } from './useBeadThumbnail'

import type { BeadId } from 'src/types'

export function BeadPreview({ beadId, size = 96 }: { beadId: BeadId | ''; size?: number }) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const { url } = useBeadThumbnail(visible ? beadId : '', size)

  useEffect(() => {
    const el = holderRef.current!
    const io = new IntersectionObserver(
      (entries) => {
        setVisible(entries[0].isIntersecting)
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holderRef} className="preview">
      {url ? <img src={url} width={size} height={size} style={{ display: 'block' }} /> : null}
    </div>
  )
}
