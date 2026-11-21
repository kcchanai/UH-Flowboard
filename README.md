# Flowboard

Flowboard is a cloud-first kanban board for planning projects, built with vanilla HTML, CSS and JavaScript and packaged with Vite.

[Open Flowboard](https://kcchanai.github.io/UH-Flowboard/) and sign in with Google. Open **Boards** to create a personal board or find a shared board you have access to. New boards are empty. Your role on a shared board controls which changes you can make.

## What you can do

- Organize work with lists and cards, and switch between board and List views.
- Find cards with filters and track details such as descriptions, due dates, labels, checklists, comments, and assignments.
- Archive or restore cards and boards where your permissions allow it. Archive and permanent deletion are distinct operations.
- Personalize the theme and list appearance. Per-list colors and gradients are saved in the current browser, not shared with other board members.

## How data is handled

Google sign-in is provided by Firebase Authentication. Board content lives in Cloud Firestore; the app is hosted on GitHub Pages. Sign-in alone does not import, merge, or delete older browser-local workspaces. Browser-local appearance settings are separate from board content. An unconfigured build does not open a local-first editing mode as a fallback.

Use synthetic data when developing or testing. A public Pages deployment does not imply approval to store institutional, confidential, or regulated records. Consult the [privacy and data boundaries](PRIVACY_AND_DATA_BOUNDARIES.md) for background and limitations.

## Develop locally

Use Node.js 22, matching CI:

~~~sh
git clone https://github.com/kcchanai/UH-Flowboard.git
cd UH-Flowboard
npm ci
npm run dev -- --host 127.0.0.1 --strictPort
~~~

Open the URL Vite prints (normally http://127.0.0.1:5173/UH-Flowboard/). An unconfigured development build can be used to inspect the signed-out or unavailable state. Use synthetic fixtures and disposable emulators for configured board behavior; do not copy production Firebase settings, credentials, or browser profiles into a test run.

- `npm run validate`: unit tests, syntax/static checks, build, asset budgets, and test isolation.
- `npm run test:rules`: Firestore Rules checks with Java 21 and a disposable demo project.
- See the [validation checklist](VALIDATION_CHECKLIST.md#current-validation) for current browser test setup and evidence boundaries.

## Repository and releases

- [Release notes](RELEASE_NOTES.md) explain how to look up the current source, validation and Pages deployments.
- [Collaboration architecture](COLLABORATION_ARCHITECTURE.md) records the original design and compatibility boundaries; it is not a current release report.
- [Validation workflow](.github/workflows/validate.yml) is the authoritative CI command list. The [Pages workflow](.github/workflows/deploy-pages.yml) normally publishes the validated main-branch push. A pull request does not deploy the app, and Pages does not publish Firestore Rules or indexes.
- This repository was formerly named UH-Trello. The former Pages URL does not redirect; use https://kcchanai.github.io/UH-Flowboard/.

## Source map

- `app.js`, `index.html` and `styles.css`: interface, dialogs and responsive layout.
- `src/main.js` and `src/runtime-bootstrap.js`: entry point and adapter wiring.
- `src/adapters/`: local and Firebase persistence boundaries.
- `state-core.js` and `tests/`: domain helpers and validation.
- `firestore.rules` and `firestore.indexes.json`: version-controlled policy sources. Check the deployed Rules revision separately before making production guarantees.
