import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Seeing Single-Cell',
  description: 'An interactive visual exploration of single-cell RNA sequencing analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
        />
      </head>
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-2xl">🔬</span>
              <span className="bg-gradient-to-r from-[#4361ee] to-[#7c3aed] bg-clip-text text-transparent">
                Seeing Single-Cell
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
              <Link href="/chapters/1-matrix" className="hover:text-[#4361ee] transition-colors">
                1 · Matrix
              </Link>
              <Link href="/chapters/2-distribution" className="hover:text-[#4361ee] transition-colors">
                2 · Distribution
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6">
          {children}
        </main>
        <footer className="border-t border-gray-100 mt-20">
          <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-gray-400">
            <p>
              Inspired by{' '}
              <a href="https://seeing-theory.brown.edu" className="text-[#4361ee] hover:underline" target="_blank" rel="noopener">
                Seeing Theory
              </a>{' '}
              and{' '}
              <a href="https://www.3blue1brown.com" className="text-[#4361ee] hover:underline" target="_blank" rel="noopener">
                3Blue1Brown
              </a>
              {' · '}
              Built with Next.js + p5.js
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
