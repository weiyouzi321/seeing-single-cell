import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          Page not found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
