import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Seeing Single-Cell',
  description: 'Interactive visualization of single-cell analysis mathematics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
          integrity="sha384-wcIxjf483k7xO1y7dbLRl6l7aCg2B8y7Gk7vZ7k7k7k7k7k7k7k7k7k7k7k7k7k7"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold text-primary">
                  Seeing Single-Cell
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/chapters/1-matrix" className="text-gray-600 hover:text-primary">
                  Matrix
                </a>
                <a href="/chapters/2-distribution" className="text-gray-600 hover:text-primary">
                  Distribution
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-gray-50 border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              Seeing Single-Cell - Interactive Single-Cell Analysis Education
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
