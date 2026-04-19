export default function Home() {
  return (
    <div className="prose max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Seeing Single-Cell
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        Interactive visualization of single-cell analysis mathematics
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <a 
          href="/chapters/1-matrix"
          className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-primary mb-3">
            Chapter 1: Gene Expression Matrix
          </h2>
          <p className="text-gray-600">
            Explore the fundamentals of single-cell data through interactive matrix visualization.
            Learn about cells, genes, and expression values.
          </p>
          <div className="mt-4 text-primary font-medium">
            Start Learning →
          </div>
        </a>
        
        <a 
          href="/chapters/2-distribution"
          className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-secondary mb-3">
            Chapter 2: Data Distribution
          </h2>
          <p className="text-gray-600">
            Understand statistical distributions in single-cell data.
            Visualize different distribution patterns and their meanings.
          </p>
          <div className="mt-4 text-secondary font-medium">
            Start Learning →
          </div>
        </a>
      </div>
      
      <div className="mt-16 p-8 bg-gray-50 rounded-xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          About This Project
        </h2>
        <p className="text-gray-600 mb-4">
          Inspired by <a href="https://seeing-theory.brown.edu" className="text-primary hover:underline">Seeing Theory</a> and{' '}
          <a href="https://www.3blue1brown.com" className="text-primary hover:underline">3Blue1Brown</a>, 
          this project aims to make single-cell analysis mathematics accessible through interactive visualizations.
        </p>
        <p className="text-gray-600">
          Designed for biology students and aspiring researchers who want to understand the mathematical principles 
          behind single-cell analysis and learn how to adjust parameters for optimal results.
        </p>
      </div>
    </div>
  )
}
