'use client'

import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const cycle: Record<string, 'light' | 'dark' | 'system'> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }
    setTheme(cycle[theme])
  }

  const icon = {
    light: <Sun className="w-5 h-5" />,
    dark: <Moon className="w-5 h-5" />,
    system: <Monitor className="w-5 h-5" />,
  }[theme]

  const label = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统',
  }[theme]

  return (
    <button
      onClick={cycleTheme}
      className="group relative p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300"
      title={`当前: ${label} (点击切换)`}
      aria-label={label}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  )
}
