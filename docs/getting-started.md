# Getting Started with Bead Grid Studio

Whether you are a craft enthusiast creating your next fuse-bead project or a developer building pixel-art tools, this guide will help you get started in minutes.

---

## Track A: For Crafters & Makers

### 1. Use the Web Application Online
Visit the official live deployment:
**[https://zwhy149.github.io/bead-grid-studio/](https://zwhy149.github.io/bead-grid-studio/)**

No account, registration, or software installation is required.

### 2. Use Completely Offline (Portable HTML)
Download `bead-grid-studio-portable.html` from the [Latest GitHub Release](https://github.com/zwhy149/bead-grid-studio/releases).
- Save the file to your computer or USB drive.
- Double-click to open in any web browser (Chrome, Edge, Safari, Firefox).
- Works 100% offline without any internet connection. Your images never leave your computer.

### 3. Step-by-Step Crafting Workflow
1. **Drop or Select an Image**: Drag any PNG, JPEG, or WebP image into the window.
2. **Choose a Board Size**: Select standard mini pegboards (e.g. 29x29 or 52x52) or adjust width and height.
3. **Select Processing Mode**:
   - **Cartoon**: Best for badges, logos, line-art, and illustrations. Cleans edges and isolates outlines.
   - **Detail**: Best for preserving fine details and textures.
   - **Photo**: Optimized for smooth tonal gradients and portraits.
   - **Pixel Art**: Direct 1:1 pixel sampling for pixel game sprites.
4. **Inspect Materials**: The material drawer lists exact bead quantities sorted by color codes.
5. **Export**: Export as printable high-resolution PNG, vector SVG, PDF, or open JSON pattern format.

---

## Track B: For Developers & Integrators

### 1. Run the Headless CLI
Generate patterns from your terminal or shell scripts:

```bash
# Clone the repository
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio

# Install dependencies (requires Node.js >= 22.12.0)
npm install

# Run the CLI tool
node bin/bead-grid.mjs tests/fixtures/rocket-badge.png -w 29 -h 29 --format ascii
```

### 2. Integrate `@bead-grid/core` in Node.js or Browser
```javascript
import { generateBeadPattern, getPaletteProvider } from './packages/core/src/index.js';

const pattern = await generateBeadPattern(imageData, {
  cols: 29,
  rows: 29,
  palette: 'mard-compatible-base-221',
  processMode: 'cartoon',
  maxColors: 24,
});

console.log(`Total Beads: ${pattern.statistics.totalBeads}`);
console.log(pattern.statistics.colors);
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## Documentation Links

- [Palette Schema & Format](palette-format.md)
- [Pattern Exchange Format](pattern-format.md)
- [Project Health & Adoption](project-health.md)
- [Performance Benchmarks](benchmark.md)
- [Developer Guide](developer-guide.md)
