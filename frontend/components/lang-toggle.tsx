import React from 'react'
import type { Lang } from '../lib/i18n'

interface LangToggleProps {
  lang: Lang
  onToggle: (lang: Lang) => void
}

export default function LangToggle({ lang, onToggle }: LangToggleProps) {
  return (
    <div className="flex items-center bg-surface-2 rounded-md p-0.5 border border-border">
      <button
        onClick={() => onToggle('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded transition-all duration-150 font-mono ${
          lang === 'en'
            ? 'bg-paint-yellow text-surface-0'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onToggle('es')}
        className={`px-2.5 py-1 text-xs font-bold rounded transition-all duration-150 font-mono ${
          lang === 'es'
            ? 'bg-paint-yellow text-surface-0'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        ES
      </button>
    </div>
  )
}
