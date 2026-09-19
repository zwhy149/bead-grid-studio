# Basic Browser Integration Example

This example demonstrates how to import and use `@bead-grid/core` directly inside a browser web page via standard ES Modules, with zero build tools or bundlers required.

## Running Locally

Because ES Modules have CORS security restrictions on `file://` protocol in most modern browsers, serve the folder using any simple static HTTP server:

```bash
# Using Node's built-in preview or any HTTP server
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080/examples/basic-browser/index.html` in your browser.

## Key Takeaways

- Zero external runtime dependencies: all color distance math (OKLab, CIEDE2000), palette mapping, and material consolidation execute client-side in pure JavaScript.
- Fully compatible with HTML5 Canvas `ImageData`.
- Can be embedded into Vue, React, Svelte, or vanilla JS web applications.
