import Link from 'next/link'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#7c3aed] mb-4">
          Interactive Learning
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          <span className="bg-gradient-to-r from-[#4361ee] via-[#7c3aed] to-[#4361ee] bg-clip-text text-transparent">
            Seeing Single-Cell
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          An interactive visual exploration of the mathematics behind{' '}
          <strong className="text-gray-700">single-cell RNA sequencing</strong>.
          <br />
          Play with the math. See what happens.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/chapters/1-matrix"
            className="px-6 py-3 rounded-xl bg-[#4361ee] text-white font-semibold 
                       hover:bg-[#3651d4] transition-all shadow-md hover:shadow-lg 
                       hover:-translate-y-0.5"
          >
            Start Learning →
          </Link>
          <a
            href="#chapters"
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold
                       hover:border-[#4361ee] hover:text-[#4361ee] transition-all"
          >
            Browse Chapters
          </a>
        </div>
      </section>

      {/* Chapters */}
      <section id="chapters" className="py-12">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-8 text-center">
          Chapters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChapterCard
            number="01"
            title="Gene Expression Matrix"
            description="What does single-cell data actually look like? Explore the rows, columns, and values that form the foundation of every analysis."
            concepts={['Cells × Genes', 'Sparsity', 'Expression values']}
            href="/chapters/1-matrix"
            color="from-[#4361ee] to-[#3b82f6]"
          />
          <ChapterCard
            number="02"
            title="Data Distribution"
            description="How are gene expression values distributed? Visualize histograms, kernel density estimates, and discover patterns in the data."
            concepts={['Histogram', 'KDE', 'Gene statistics']}
            href="/chapters/2-distribution"
            color="from-[#7c3aed] to-[#a855f7]"
          />
          <ChapterCard
            number="03"
            title="Normalization"
            description="Why do we need to normalize? Explore how library size differences affect analysis and how normalization corrects them."
            concepts={['Library size', 'Log transform', 'Scaling']}
            href="#"
            color="from-[#10b981] to-[#34d399]"
            comingSoon
          />
          <ChapterCard
            number="04"
            title="Dimensionality Reduction"
            description="From thousands of dimensions to a 2D map. Understand PCA, t-SNE, and UMAP through interactive visualizations."
            concepts={['PCA', 't-SNE', 'UMAP']}
            href="#"
            color="from-[#f59e0b] to-[#fbbf24]"
            comingSoon
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-gray-100 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">How to Use This Site</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="text-3xl mb-3">👆</div>
              <h3 className="font-semibold mb-1">Interact</h3>
              <p className="text-sm text-gray-500">
                Hover, click, and drag on visualizations. Adjust sliders and parameters in real-time.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-semibold mb-1">Read & Observe</h3>
              <p className="text-sm text-gray-500">
                Each section explains a concept, then shows it visually. Watch the math come alive.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="font-semibold mb-1">Experiment</h3>
              <p className="text-sm text-gray-500">
                Change parameters and see the effects immediately. Build intuition through play.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ChapterCard({
  number,
  title,
  description,
  concepts,
  href,
  color,
  comingSoon,
}: {
  number: string
  title: string
  description: string
  concepts: string[]
  href: string
  color: string
  comingSoon?: boolean
}) {
  const Wrapper = comingSoon ? 'div' : Link
  const wrapperProps = comingSoon ? {} : { href }

  return (
    <Wrapper
      {...wrapperProps}
      className={`group block p-6 bg-white rounded-2xl border border-gray-100 
                  shadow-sm transition-all duration-200
                  ${comingSoon ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-1 hover:border-gray-200'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${color} text-white text-xs font-bold`}>
          Chapter {number}
        </span>
        {comingSoon && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
            Coming Soon
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-[#4361ee] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {concepts.map((c) => (
          <span
            key={c}
            className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full"
          >
            {c}
          </span>
        ))}
      </div>
    </Wrapper>
  )
}
