import { useEffect } from 'react'

declare global {
  interface Window {
    kofiwidget2?: {
      init: (label: string, color: string, id: string) => void
      draw: () => void
    }
    __kofiWidgetLoaded?: boolean
  }
}

type Props = {
  label?: string
  color?: string
  id: string
}

export default function KoFiButton({
  label = 'Support me on Ko-fi',
  color = '#72a4f2',
  id,
}: Props) {
  useEffect(() => {
    let cancelled = false

    const ensureScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.kofiwidget2) return resolve()
        const existing = document.querySelector(
          'script[data-ko-fi="widget2"]'
        ) as HTMLScriptElement | null
        if (existing) {
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error('Ko-fi script failed to load')))
          if ((existing as any).readyState === 'complete') resolve()
          return
        }
        const s = document.createElement('script')
        s.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js'
        s.async = true
        ;(s as any).defer = true
        s.dataset.koFi = 'widget2'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Ko-fi script failed to load'))
        document.body.appendChild(s)
      })

    ensureScript()
      .then(() => {
        if (cancelled) return
        try {
          // Avoid re-initializing if this component mounts more than once
          if (!window.__kofiWidgetLoaded && window.kofiwidget2) {
            window.kofiwidget2.init(label, color, id)
            window.kofiwidget2.draw()
            window.__kofiWidgetLoaded = true
          }
        } catch (e) {
          console.error('Ko-fi widget error:', e)
        }
      })
      .catch((e) => console.error(e))

    return () => {
      cancelled = true
    }
  }, [label, color, id])

  // Ko‑fi renders a floating button; nothing to render in React
  return null
}

