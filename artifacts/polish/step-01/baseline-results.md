# Step 1 baseline results

- Baseline client revision: `b208b564236ead57b3dd5b33b70686445ae92e67`.
- Rules SHA-256: `[REDACTED]` in shared reports; the structured local manifest retains the verified hash.
- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped. Static guards, build, source budget, and production-asset isolation passed.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- `npm.cmd run test:emulator-browser`: first invocation exited 1 because the managed Playwright Chromium executable was absent. The same tracked runner with the installed system Chrome executable in a fresh isolated Playwright context exited 0 with 1 test passed.
- Built-preview browser smoke: exit 0, 29 passed, 0 failed, 0 skipped.
- Baseline screenshot capture: exit 0, five screenshots captured at the desktop matrix, resized desktop window, and limited narrow-width compatibility viewport.
- Source measurement: 217,207 raw bytes, 293 bytes below the 217,500-byte cap. Initial shell gzip 23,632 bytes. First-party lazy gzip 44,000 bytes. Document gzip 5,556 bytes. The maintainability warning above 210,000 bytes remains non-blocking.
- Browser version: Chrome 153.0.8010.48, launched by Playwright with an isolated context and no normal browser profile.
- Production boundary: no production Firestore data, Rules, protected workspace, real account, merge, push, or deployment was touched.

The original raw runner logs were intentionally removed after extracting counts and redacting environment/fixture details. See `baseline.json` for the machine-readable record and the five adjacent PNG files for curated visual evidence.
