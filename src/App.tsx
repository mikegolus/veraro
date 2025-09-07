import { useMemo, useState } from 'react'

import { getCircumferenceMM } from './lib/helpers'
import { useStore } from './store'
import { BraceletScene } from './three/BraceletScene'
import { Controls } from './ui/Controls'

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const bracelet = useStore((s) => s.bracelet)

  const circumference = useMemo(() => {
    const circumferenceMM = getCircumferenceMM(bracelet)
    return {
      mm: circumferenceMM,
      in: (circumferenceMM * (1 / 25.4)).toFixed(2),
    }
  }, [bracelet])

  return (
    <div className="app">
      <div className="header">
        <svg className="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 288">
          <path d="M13.3,98.8l130.9,130.9,11.6-11.6L40.1,102.3c6.2-3.2,12.5-6.1,18.9-8.7,27.1-11,55.7-16.6,85.1-16.6,29.4,0,58,5.6,85.1,16.6,6.5,2.6,12.8,5.6,19,8.8l-76,76-59-59c10.2-1.7,20.5-2.6,30.9-2.6s20.7.9,30.9,2.6l-14.5,14.5,11.6,11.6,35.1-35.1c-41-13.4-85.3-13.4-126.3,0l91.3,91.3,102.8-102.8c-79.5-51-182.2-51-261.7,0Z" />
        </svg>
        <h1 className="title">Veraro Studio</h1>
      </div>

      <div className="layout">
        <div className="scene-wrapper">
          <BraceletScene />
          <div className="scene-description">
            Estimated Final Size: <strong>{circumference.in} in</strong> ({circumference.mm / 10}{' '}
            cm)
          </div>
        </div>
        <aside className="side">
          <Controls />
        </aside>
      </div>

      {mobileOpen && (
        <div className="mobile-overlay" role="dialog" aria-modal="true">
          <div className="mobile-panel">
            <div className="mobile-panel-header">
              <h2>Controls</h2>
              <button className="menu-btn" onClick={() => setMobileOpen(false)} aria-label="Close">
                Close
              </button>
            </div>
            <div className="mobile-panel-body">
              <Controls />
            </div>
          </div>
          <div className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-hidden />
        </div>
      )}
    </div>
  )
}
