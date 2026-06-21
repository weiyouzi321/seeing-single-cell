declare global {
  interface Window {
    katex?: {
      render: (tex: string, element: HTMLElement, options?: object) => void
      renderToString: (tex: string, options?: object) => string
    }
  }
}

export function renderKatex(tex: string, options?: object): string {
  if (typeof window !== 'undefined' && window.katex) {
    return window.katex.renderToString(tex, options)
  }
  return tex
}
