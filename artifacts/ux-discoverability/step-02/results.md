# Step 2 of 10 results: approved source-budget transition

## Decision and implementation

Aaron approved the quantified raw source cap proposal. The validator now uses a **247,500-byte** raw source cap. The maintainability warning remains **210,000 bytes**. The initial-shell gzip cap remains **25,000 bytes**, and the first-party lazy gzip cap remains **55,000 bytes**. No production application behavior or Rules changed in this step.

## Verification

- `npm.cmd run check`: passed
- `npm.cmd run build`: passed; 47 modules transformed
- `npm.cmd run measure:mvp-v2`: passed
- Reachable source: **239,380 / 247,500 bytes**
- Headroom: **8,120 bytes**
- Reachable production sources: **27**
- Unbudgeted reachable sources: **0**
- Initial shell gzip: **24,512 / 25,000**
- First-party lazy gzip: **50,269 / 55,000**
- Document gzip: **5,587**
- Vendor gzip: **139,736**
- Rules source: unchanged
- Production: unchanged

The transition is a release allocation, not permission to fill the remaining headroom. Every later step must remeasure and preserve at least **2,000 bytes** of final maintenance headroom.
