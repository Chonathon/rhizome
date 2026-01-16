import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Component that syncs the theme-color meta tag and iOS status bar style
 * with the current app theme. This ensures Safari mobile browser controls
 * match the app's light/dark mode.
 */
export function MetaThemeColor() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    // Determine if dark mode is active
    const isDark = resolvedTheme === 'dark'

    // Update theme-color meta tag for browser UI
    const themeColor = isDark ? '#252525' : '#ffffff'
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])')

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    metaThemeColor.setAttribute('content', themeColor)

    // Update apple-mobile-web-app-status-bar-style for iOS Safari
    const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarStyle) {
      statusBarStyle.setAttribute('content', isDark ? 'black-translucent' : 'default')
    }
  }, [theme, resolvedTheme])

  return null
}
