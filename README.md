# Seeing Single-Cell 🧬

Interactive visualization of single-cell analysis mathematics, inspired by [Seeing Theory](https://seeing-theory.brown.edu/) and [3Blue1Brown](https://www.3blue1brown.com/).

## 🎯 Project Goals

- Help biology students understand the mathematical principles behind single-cell analysis
- Provide interactive visualizations to build intuition about algorithms and parameters
- Enable researchers to better understand and optimize their analysis pipelines

## 📚 Chapters

### Chapter 1: Gene Expression Matrix
- Interactive visualization of the expression matrix
- Understanding cells, genes, and expression values
- Mathematical representation and key concepts

### Chapter 2: Data Distribution
- Statistical distributions in single-cell data
- Histograms and kernel density estimation
- Distribution parameters and their meanings

### Chapter 3: PCA (Coming Soon)
- Principal component analysis visualization
- Covariance matrix and eigenvalues
- Dimensionality reduction

### Chapter 4: t-SNE (Coming Soon)
- t-distributed stochastic neighbor embedding
- Probability distributions and optimization
- Perplexity parameter effects

### Chapter 5: Clustering (Coming Soon)
- K-means clustering visualization
- Distance metrics and optimization
- Cluster validation

### Chapter 6: Differential Expression (Coming Soon)
- Statistical hypothesis testing
- p-values and multiple testing correction
- Volcano plots and effect sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/seeing-single-cell.git
cd seeing-single-cell

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the project
npm run build

# Export static files
npm run export
```

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 14
- **Visualization**: p5.js (interactive) + D3.js (charts)
- **Mathematics**: Math.js + KaTeX (formulas)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📊 Data

The project uses simulated PBMC (Peripheral Blood Mononuclear Cell) data for educational purposes:
- 100 cells
- 50 genes
- 6 cell types (CD4 T, CD8 T, B, NK, Monocyte, DC)

## 🎨 Design Philosophy

Inspired by [Seeing Theory](https://seeing-theory.brown.edu/):
- Clean, minimalist design
- Interactive visualizations
- Mathematical rigor with accessibility
- Progressive disclosure of complexity

## 📖 References

- [Seeing Theory](https://seeing-theory.brown.edu/) - Probability and statistics visualization
- [3Blue1Brown](https://www.3blue1brown.com/) - Mathematical animations
- [Seurat](https://satijalab.org/seurat/) - Single-cell analysis toolkit
- [Scanpy](https://scanpy.readthedocs.io/) - Single-cell analysis in Python

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the amazing work of [Daniel Kunin](https://github.com/danielkunin) on Seeing Theory
- Thanks to the [Brown University](https://www.brown.edu/) STATS4STEM program
- Built with love for the single-cell biology community

---

**Made with ❤️ for biology students and researchers**
