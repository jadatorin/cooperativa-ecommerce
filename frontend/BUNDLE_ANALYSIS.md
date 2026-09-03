# Bundle Analysis

Bundle analysis visualizes what's inside your production bundles so you can optimize size and performance.

## Running the Analyzer

```bash
npm run analyze
```

This builds the app with `ANALYZE=true` and opens an interactive treemap in your browser.

## Interpreting the Results

The treemap shows **every module** in each chunk, sized by its contribution to the total bundle:

- **Large rectangles** = biggest contributors to bundle size. These are your optimization targets.
- **Color** indicates the directory/source origin of the module.

### Common Optimization Strategies

| Pattern | Action |
|---------|--------|
| Large shared libraries (e.g., lodash, moment) | Replace with lighter alternatives (lodash-es, date-fns, dayjs) |
| Duplicate packages in multiple chunks | Check `next/dynamic` imports, dedupe with `optimizeDeps` |
| Huge page bundles | Code-split with `next/dynamic` so pages load only what they need |
| Icon libraries pulling everything | Use per-icon imports (`lucide-react/icon-name`) instead of barrel imports |
| Large CSS-in-JS bundles | Consider Tailwind (already in use) or critical CSS extraction |

### Key Chunks to Watch

- **`_app`**: Global dependencies. Keep minimal.
- **`_shared`**: Code shared across pages — good for common utilities.
- **Page-specific chunks**: Should be small; large page chunks indicate missing dynamic imports.

### CI Integration

You can run `npm run analyze` in CI and export the HTML report for artifact storage. The report is generated in `.next/analyze/`.
