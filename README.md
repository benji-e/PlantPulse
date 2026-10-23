# PlantPulse

PlantPulse is a mobile-first Progressive Web App (PWA) for cassava leaf checking and practical disease guidance. It runs a TensorFlow.js image classifier in the browser, stores saved scans in the browser's IndexedDB, and can work offline after its application and model assets have been cached.

PlantPulse is a **decision-support tool**, not a laboratory test, diagnosis, or replacement for a Ugandan agronomist or agricultural extension officer. A model score is not necessarily the probability that a prediction is correct. Always use field context and expert advice when deciding how to manage a crop.

## Contents

- [Project at a glance](#project-at-a-glance)
- [What PlantPulse can do](#what-plantpulse-can-do)
- [Important: there are two different model projects here](#important-there-are-two-different-model-projects-here)
- [Requirements](#requirements)
- [Run PlantPulse locally](#run-plantpulse-locally)
- [How to use the app](#how-to-use-the-app)
- [How diagnosis works](#how-diagnosis-works)
- [Model files and replacement models](#model-files-and-replacement-models)
- [Privacy, storage, and offline operation](#privacy-storage-and-offline-operation)
- [Languages, accessibility, and responsive design](#languages-accessibility-and-responsive-design)
- [Project structure](#project-structure)
- [Build and validate](#build-and-validate)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)
- [Manual verification checklist](#manual-verification-checklist)
- [Model performance and limitations](#model-performance-and-limitations)
- [Photo credits](#photo-credits)
- [License and contributions](#license-and-contributions)

## Project at a glance

| Area | Current implementation |
|---|---|
| Front end | React 18, TypeScript, Vite |
| Styling | Tailwind CSS plus the shared rules in [`src/styles.css`](./src/styles.css) |
| Diagnosis | TensorFlow.js, using the bundled five-class cassava GraphModel |
| Model input | 160 × 160 RGB pixels, with the deployed model's own rescaling layer |
| Supported labels | `cbb`, `cbsd`, `cgm`, `cmd`, and `healthy` |
| Supported UI languages | English and Luganda |
| Navigation | Top-right links on laptop/desktop; fixed bottom tabs on smaller screens |
| Scan storage | IndexedDB via Dexie; data stays in the current browser profile |
| Offline support | Vite PWA service worker, cached app assets, and locally cached model files |
| Authentication | Not included. PlantPulse has no sign-in or login feature. |
| Server/API | No PlantPulse application server or diagnosis API; inference runs locally in the browser |

PlantPulse does not require a Python environment to run the web application. Python files and training assets in `multi_crop_classifier` are separate from the browser application.

## What PlantPulse can do

- Show an introductory landing page and first-use onboarding.
- Select or capture a cassava leaf photo, with desktop drag-and-drop support.
- Run the bundled TensorFlow.js model locally and show the leading predictions.
- Use a confidence threshold to avoid displaying a definitive disease name when the top model score is low.
- Show locally stored plain-language descriptions, symptoms, practical next steps, prevention suggestions, and when to contact an extension officer.
- Save and reopen scan results in local browser history, or delete individual scans and clear the history.
- Search and filter the disease guide.
- Read result advice aloud using the browser's Web Speech API when an appropriate speech voice is available.
- Share a result using the Web Share API or copy its text where browser support permits.
- Change the interface language between English and Luganda, and enable larger text.
- Display model readiness, offline caching status, model size, inference backend, last inference time, and connection status.
- Offer PWA installation when the browser supports the installation prompt.

The app covers **cassava leaves only**, with five model labels. It does not diagnose other crops, inspect roots, identify every cassava disease, or replace field inspection.

## Important: there are two different model projects here

The workspace contains more than one machine-learning effort. They must not be confused or interchanged:

1. **PlantPulse web-app model:** the five-class cassava TensorFlow.js GraphModel in [`public/model/v2/`](./public/model/v2/). This is what the website loads.
2. **Experimental multi-crop Python project:** scripts, datasets, checkpoints, and results under [`multi_crop_classifier/`](./multi_crop_classifier/). Its saved experimental model uses a different class mapping and is not the model used by the PlantPulse UI.

Read [`multi_crop_classifier/README.md`](./multi_crop_classifier/README.md) before running that separate workflow. Its 29-class experiment is not a substitute for the five-class browser model, and its labels file must not be copied over the web model's `labels.json`.

## Requirements

- A current Node.js LTS release with npm.
- A modern browser with JavaScript enabled.
- Internet access for the first installation and first model download. After all required files are cached, the app is designed to run offline.
- For live camera capture: `localhost` during local development, or an HTTPS deployment. Browsers generally restrict camera access on ordinary non-local HTTP pages.

Check the installed tools:

```powershell
node --version
npm --version
```

## Run PlantPulse locally

Open PowerShell in the project root (the directory containing `package.json`), then install dependencies and start Vite:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173/`.

For a production-like local preview:

```powershell
npm run build
npm run preview
```

Vite prints the preview URL when the preview server starts. Use `localhost` when testing camera access locally.

### Available npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run the TypeScript project build (`tsc -b`) and create the production PWA in `dist/`. |
| `npm run preview` | Serve the already-built `dist/` output locally for a production preview. Run `npm run build` first. |

The Vite development server is configured to listen on all interfaces. A phone on the same Wi-Fi may be able to open the computer's network address for page testing, but camera access on a plain LAN HTTP address may be blocked by the browser. Use an HTTPS deployment to test the camera on a phone.

## How to use the app

### Navigation

- On laptop and desktop widths, use the horizontal navigation in the top-right of the header: **Home**, **Scan**, **My Scans**, **Disease Guide**, **Settings**, and **Help**.
- On smaller screens, use the fixed bottom navigation for **Home**, **Scan**, **My Scans**, **Disease Guide**, and **Settings**. Help is also reachable from the header and from Home and Settings.
- The active route is highlighted in the navigation.

### Main screens

| Screen | Route | What it is for |
|---|---|---|
| Home / landing | `/` | Start a scan or upload a photo; open history, guide, help, or developer information. First use also shows the splash and onboarding. |
| Scan / capture | `/scan` and `/capture` | Open the camera, select a photo, or drop a file onto the desktop drop area. |
| Analyzing | `/analyzing` | Preprocess the selected photo and run local inference. |
| Result | `/result` | See the leading class, confidence score, status, advice, other model possibilities, and save/share/read-aloud actions. Opening this route without an in-memory result shows a prompt to start a scan. |
| My Scans | `/history` | Reopen or delete scans saved in this browser. |
| Disease Guide | `/guide` | Search and filter the five cassava entries; expand an entry for more details. |
| Settings | `/settings` | Change language and text size, clear saved scans, and open Help or About. |
| Help | `/help` | Learn how to take a useful photo and what the classifier can and cannot do. |
| About / Developer info | `/about` | Inspect model status, cache size, active backend, most recent inference duration, connection, preprocessing, and model scope. |

### Taking or uploading a photo

1. Select **Scan** or **Scan a Plant**.
2. Choose **Open camera** and allow camera access, or choose **Choose photo** to use an existing image.
3. On desktop, a photo can also be dropped into the indicated area.
4. The preview screen lets you choose **Use this photo** or select another photo.
5. The app resizes a selected photo before classification. The input image must be an image and must not exceed 25 MB.
6. Wait for the result. Inference runs on the device; the original image is not sent to a server.

For best results, photograph one cassava leaf in daylight, keep the affected area in focus, and avoid shadows, blur, or very dark images. Camera use requires permission. If the browser cannot open the camera or permission is denied, use the photo chooser instead.

### Understanding a result

- The leading prediction is compared with the threshold in [`src/config/model.ts`](./src/config/model.ts).
- If its score is below the threshold, the interface shows **Not sure** instead of displaying the predicted disease as a diagnosis.
- Scores shown as percentages are model scores, not calibrated probabilities of correctness.
- The second and third predictions are shown as other possibilities where available.
- Disease advice is general decision support. It is not a pesticide prescription and should not be treated as a confirmed diagnosis.
- Save a result to make it available in My Scans. Saving stores a small thumbnail and result metadata locally, not the original full-size photo.
- Read-aloud depends on browser and operating-system voice support. A Luganda voice may not be installed even when the app interface is in Luganda.
- Share behavior depends on browser support. The app attempts the Web Share API and otherwise attempts to copy result text.

## How diagnosis works

1. At app startup, PlantPulse dynamically imports the classifier, selects a supported TensorFlow.js backend, loads the local GraphModel and labels, checks that the output class count matches the label count, and runs a warm-up prediction.
2. The selected photo is decoded and resized to a maximum dimension of 1600 pixels before it is passed to the classifier. The classifier resizes the pixels to the model's 160 × 160 input.
3. The model produces one score per class. PlantPulse matches each label to its local disease-guide entry, sorts scores from highest to lowest, and keeps the top three.
4. The top score is compared with the configured confidence threshold. When it is below the threshold, the result is presented as uncertain.
5. If the user saves the result, a 480-pixel maximum-dimension JPEG preview and the prediction metadata are saved to IndexedDB.

TensorFlow.js backend preference is **WebGL → WASM → CPU**. The WASM runtime is copied into the production output and served locally, so the WASM backend does not need to fetch its runtime from a third-party CDN.

The inference duration shown in the app is measured around tensor creation and model prediction. Image selection, file decoding, initial model download, and the separate thumbnail creation are not included in that duration.

## Model files and replacement models

### Current browser model

The currently configured browser model is located here:

```text
public/
└── model/
    └── v2/
        ├── model.json
        ├── labels.json
        ├── group1-shard1of3.bin
        ├── group1-shard2of3.bin
        └── group1-shard3of3.bin
```

The browser loads:

- GraphModel definition: `/model/v2/model.json`
- Training-order labels: `/model/v2/labels.json`
- Weight files listed in the `weightsManifest` inside `model.json`

The current label order is:

```json
["cbb", "cbsd", "cgm", "cmd", "healthy"]
```

The label meanings are:

| Label | Meaning |
|---|---|
| `cbb` | Cassava Bacterial Blight |
| `cbsd` | Cassava Brown Streak Disease |
| `cgm` | Cassava Green Mottle |
| `cmd` | Cassava Mosaic Disease |
| `healthy` | Healthy-looking cassava leaves |

The local advice associated with each label is in [`src/data/diseases.json`](./src/data/diseases.json). Luganda versions are in [`src/i18n/diseases-lg.json`](./src/i18n/diseases-lg.json).

### Input dimensions and normalization

The app configuration is in [`src/config/model.ts`](./src/config/model.ts):

```ts
modelUrl: '/model/v2/model.json',
labelsUrl: '/model/v2/labels.json',
inputSize: 160,
normalization: 'inside-model',
confidenceThreshold: 0.6,
maxImageDimension: 1600
```

The deployed model expects **160 × 160 RGB** data. It includes a model-side `Rescaling(1 / 127.5, offset=-1)` layer. Accordingly, PlantPulse converts resized pixels to floating point while retaining the original `[0, 255]` range and lets the model apply the `[-1, 1]` scaling. Do not normalize the pixels a second time when using this export.

Supported `normalization` modes in the classifier are:

- `inside-model`: pass `[0, 255]` pixels to an export that contains its own rescaling layer. This is the current setting.
- `minus-one-to-one`: apply `(pixel / 127.5) - 1` in the browser when the replacement model does not rescale internally and was trained with `[-1, 1]` input.
- `zero-to-one`: apply `pixel / 255` in the browser when the replacement model was trained with `[0, 1]` input.

Always choose preprocessing to match the actual training pipeline and exported model. Changing only the setting based on a guess can silently reduce prediction quality.

### Replacing or updating the model

Use a TensorFlow.js **GraphModel** export that matches the input shape and preprocessing expected by the app. A Keras `.keras` file is not directly loadable by this browser implementation. Keep a model's JSON, all manifest-referenced weight shards, and labels from the **same training run** together.

Recommended update procedure:

1. Export the trained model to TensorFlow.js GraphModel format.
2. Place the complete export in a new versioned folder, for example `public/model/v3/`. Include `model.json`, `labels.json`, and every weight shard named by its weight manifest.
3. Ensure all listed shard paths resolve to files hosted alongside PlantPulse on the same origin. The app intentionally does not depend on a remote model host for private, offline inference.
4. Set `modelUrl`, `labelsUrl`, `inputSize`, `normalization`, and, if appropriate, `confidenceThreshold` in `src/config/model.ts`.
5. Update the model cache name in `src/services/classifier.ts` and the service-worker runtime cache name in `vite.config.ts` when publishing a new model version. Use the same new version in both locations to prevent an installed PWA from reusing old cached weights.
6. Update the local disease entries and translations if the output labels or class meanings changed. The UI currently expects a matching disease-guide entry for each output label.
7. Run `npm run build`, deploy the new build, and verify it in a clean browser profile and on a previously installed PWA.

The model loader validates that the export is a GraphModel, checks that a weight manifest is present, and checks that the output class count equals the number of string labels. That check cannot prove the labels are in the correct training order; verify label order independently from the training/export process.

Do not overwrite the existing model files with mismatched shards or labels. Versioned model folders make deployment and service-worker cache updates easier to reason about.

## Privacy, storage, and offline operation

### What stays on the device

- Photos are decoded and classified in the browser. PlantPulse has no upload API, remote database, analytics, or login.
- Scan history is stored locally in IndexedDB using the database named `PlantPulse`.
- Only the resized JPEG preview, top predictions, timestamp, inference duration, and backend name are saved for a scan.
- Language and larger-text preferences are stored in local storage. First-use onboarding completion is also remembered by the browser.
- Data is local to the browser profile on that device. It is not synchronized with other devices and may be removed if the browser's site data is cleared, the app is uninstalled, or the device's storage is cleared.

### First load and offline use

The first visit requires network access to download the app and model. Keep PlantPulse open until the badge says **Model ready, works offline**. After the GraphModel has loaded, PlantPulse fetches the model definition, label file, and each weight shard into its model cache. The service worker caches the app shell and routes model requests through a cache-first strategy.

For a reliable offline test:

1. Open the deployed site while online.
2. Wait for **Model ready, works offline**.
3. Visit the Guide and About screens once.
4. Install the PWA if desired, then close and reopen it online once.
5. Enable airplane mode and check that Home, the Guide, saved history, and a new diagnosis still work.

Offline diagnosis requires both the app shell and every model file to be cached. A model that has not finished downloading cannot be used offline. Service-worker updates may take effect after the browser refreshes or reopens the app.

## Languages, accessibility, and responsive design

- English and Luganda UI dictionaries are in [`src/i18n/en.json`](./src/i18n/en.json) and [`src/i18n/lg.json`](./src/i18n/lg.json).
- Cassava-specific advice translations are in [`src/i18n/diseases-lg.json`](./src/i18n/diseases-lg.json).
- The language preference is saved on the device; changing it updates the app interface and the document language metadata.
- Nunito is installed through `@fontsource/nunito` and bundled with the app; the font does not need a third-party CDN at runtime.
- The design is mobile-first, with large touch targets, keyboard-visible focus styles, labels for controls, text alternatives for photos, and support for reduced-motion preferences.
- Laptop/desktop navigation is in the top-right header. Smaller screens use bottom navigation.
- The result screen uses a wider two-column arrangement on large screens and a stacked layout on phones.

When adding or changing a translation key, update both `en.json` and `lg.json`. Keep the keys aligned and check disease names and advice in both languages.

## Project structure

```text
.
├── public/
│   ├── images/                  # Bundled landing-page photos
│   ├── model/v2/                # Browser-ready five-class cassava model
│   ├── favicon.svg
│   └── icon-192.svg, icon-512.svg
├── src/
│   ├── components/              # Shared shell, navigation, picker, badges, UI
│   ├── config/model.ts          # Model paths, input, preprocessing, threshold
│   ├── data/diseases.json       # English disease/advice data
│   ├── hooks/                   # Shared React hooks, including translations
│   ├── i18n/                    # English/Luganda UI and disease dictionaries
│   ├── lib/                     # Types, IndexedDB, image preparation, localization
│   ├── pages/                   # Home, scan flow, result, guide, history, settings
│   ├── services/classifier.ts   # TensorFlow.js loading, caching, and prediction
│   ├── store/appStore.ts        # Shared in-memory state and local preferences
│   ├── App.tsx                  # Routes and app/model startup
│   ├── main.tsx                 # React entry point and local font imports
│   └── styles.css               # Tailwind layers and application styles
├── multi_crop_classifier/       # Separate experimental Python model workflow
├── index.html                   # PWA entry HTML and metadata
├── tailwind.config.js           # Theme colors and typography
├── vite.config.ts               # Vite, PWA, service worker, WASM asset copy
├── package.json                 # Commands and JavaScript dependencies
└── README.md
```

### Where common changes belong

| Change | File or folder |
|---|---|
| Model URL, input size, normalization, threshold | [`src/config/model.ts`](./src/config/model.ts) |
| Model loading, backend selection, cache, prediction | [`src/services/classifier.ts`](./src/services/classifier.ts) |
| English disease advice | [`src/data/diseases.json`](./src/data/diseases.json) |
| English and Luganda interface copy | [`src/i18n/en.json`](./src/i18n/en.json), [`src/i18n/lg.json`](./src/i18n/lg.json) |
| Luganda cassava disease advice | [`src/i18n/diseases-lg.json`](./src/i18n/diseases-lg.json) |
| Routes and startup | [`src/App.tsx`](./src/App.tsx) |
| Shared header and navigation | [`src/components/AppShell.tsx`](./src/components/AppShell.tsx) |
| Theme colors | [`tailwind.config.js`](./tailwind.config.js) |
| Service worker and PWA manifest | [`vite.config.ts`](./vite.config.ts) |
| Image size checks and thumbnails | [`src/lib/images.ts`](./src/lib/images.ts) |
| Local history schema | [`src/lib/database.ts`](./src/lib/database.ts) |

## Build and validate

Create an optimized production build:

```powershell
npm run build
```

This runs TypeScript's project build and Vite. It writes the deployable site to `dist/`, including the service worker, web manifest, local font files, local WASM runtime, images, and model files copied from `public/`.

The repository currently provides `dev`, `build`, and `preview` npm scripts; there is no standalone automated test script in `package.json`. A successful build verifies TypeScript and production bundling, but it does not replace manual camera, browser, offline, and real-device checks. TensorFlow.js can produce a non-blocking chunk-size warning because the classifier bundle is large; the classifier itself is dynamically imported so it is kept separate from the initial application chunk.

After building, confirm these files exist in the output:

```text
dist/index.html
dist/manifest.webmanifest
dist/sw.js
dist/model/v2/model.json
dist/model/v2/labels.json
dist/model/v2/group1-shard1of3.bin
dist/model/v2/group1-shard2of3.bin
dist/model/v2/group1-shard3of3.bin
```

Also check that `dist/images/` contains the local landing photos and that the WASM runtime files are under `dist/tfjs-wasm/`.

## Deploy

PlantPulse is a static front-end. Deploy the contents of `dist/` to a static host such as Netlify, Vercel, or GitHub Pages.

Deployment requirements:

1. Build the app with `npm run build`.
2. Publish the generated `dist/` directory, not the TypeScript source directory.
3. Serve the site over **HTTPS**. HTTPS is required for the service worker and is required by browsers for camera access outside localhost.
4. Configure SPA fallback so application routes such as `/guide`, `/history`, `/settings`, and `/about` serve `index.html` when opened directly. The Vite PWA configuration uses an `index.html` navigation fallback at runtime; the host should also be configured not to return a 404 for these paths.
5. Keep the app at the site root for the current configuration. Model paths, WASM paths, icons, and the PWA start URL are root-relative.
6. Check the host's maximum file size and MIME handling for model weight shards and `.wasm` runtime files.
7. After deployment, open the site online and wait until the model is ready before testing offline behavior.

### Netlify or Vercel

Set the build command to `npm run build` and the publish/output directory to `dist`. Use the platform's single-page-app rewrite/fallback option to serve `index.html` for app routes. Deployments must retain all contents of `dist/`, including `model/`, `images/`, and `tfjs-wasm/`.

### GitHub Pages

The current app assumes hosting at `/`. GitHub Pages project sites commonly use a repository subpath such as `/repository-name/`. Before using a subpath, configure Vite's `base`, React Router's `basename`, the model and labels URLs, WASM paths, PWA manifest start URL/icons, and service-worker navigation fallback to agree on that path. Then rebuild and verify every asset URL. For the simplest deployment, use a host or custom domain that serves PlantPulse from the root path.

## Troubleshooting

### The model badge stays on “Preparing diagnosis model”

- Keep the app online while the model JSON, label file, and weight shards download.
- In the About screen, check model status and network status.
- Confirm every file listed in `public/model/v2/model.json`'s `weightsManifest` exists at the expected URL in the deployed site.
- Open `/model/v2/model.json` directly in the browser. It should return JSON, not an HTML 404 page or the app's `index.html`.
- Confirm the hosting platform has not omitted large `.bin` shard files or rewritten their paths.
- Confirm the folder version in `src/config/model.ts` matches the folder deployed under `public/model/`.

### The model worked before an update but now fails

- Check that `model.json`, all its shards, and `labels.json` came from the same export.
- Check the model's input size and normalization against `src/config/model.ts`.
- Check that the output class count equals the number of labels and each label has an entry in `src/data/diseases.json`.
- Publish a new model folder and update both cache names, as described in [Replacing or updating the model](#replacing-or-updating-the-model).
- On a test device, close and reopen the PWA or clear that site's cached data to remove obsolete files. Clearing site data also removes local scan history and preferences, so export or preserve anything important first.

### Camera does not open

- Allow camera permission in the browser's site settings.
- Use `http://localhost` for local development or an HTTPS deployment. A regular LAN HTTP address is not considered a secure origin by many browsers.
- If camera access is unsupported or denied, select **Choose photo** instead.
- Close other apps or tabs currently using the camera and retry.

### A photo cannot be selected or analyzed

- Use a supported image file that the browser can decode.
- Ensure the file is no larger than 25 MB.
- Try a clear JPG, PNG, or WebP image in good light.
- If a selected photo is blurry, dark, or not a cassava leaf, the model may return a low score or an incorrect class.

### I see “Not sure”

“Not sure” is an intentional result when the leading model score is below the configured threshold. It is not a prediction that the plant is healthy. Take a clearer photo in daylight or ask an extension officer.

### Scan history is empty or missing

- Scans are only stored after **Save to History** is selected on a result.
- History is local to the current browser profile and device; it does not synchronize.
- Private/incognito sessions, browser storage cleanup, site-data clearing, and app uninstallation may remove stored scans.
- If storage is unavailable or disabled by browser policy, IndexedDB persistence may not work.

### The page does not load after deployment

- Confirm that the host publishes `dist/` and not the repository root.
- Configure SPA fallback for direct route access.
- Check that the site is at the root URL expected by the root-relative asset paths.
- Inspect the browser console/network panel for missing JS, CSS, model, or WASM files.
- Refresh after a deployment so the service worker can activate the updated version.

### Speech or sharing is unavailable

Browser support differs. The system may not include a Luganda voice, speech synthesis may be disabled, or sharing/clipboard APIs may require HTTPS and a user gesture. These features are optional; result text and advice remain visible on screen.

## Manual verification checklist

### Navigation and responsive layout

- [ ] At laptop/desktop width, the top-right links show Home, Scan, My Scans, Disease Guide, Settings, and Help.
- [ ] At phone/tablet width, the bottom navigation is visible and usable.
- [ ] Every navigation item opens the expected route, and the current tab is highlighted.
- [ ] The layout has no horizontal scrolling at narrow phone widths.
- [ ] Browser back/forward navigation and direct links to app routes work on the deployment host.

### Core app use

- [ ] First-use splash and onboarding can be completed or skipped.
- [ ] Home's scan button opens the scan flow.
- [ ] Photo selection displays a preview; retake/reselect and continue actions work.
- [ ] Camera works on a permitted secure origin, and photo selection remains usable if camera access is unavailable.
- [ ] A real cassava leaf photo returns a model result.
- [ ] Scores below the threshold show **Not sure** rather than an unqualified disease name.
- [ ] Result advice, other possibilities, read-aloud, save, share/copy, and scan-another actions behave as supported by the browser.

### History, guide, and settings

- [ ] Saved scans appear in My Scans and can be reopened.
- [ ] Individual deletion and clear-history confirmation work.
- [ ] Guide search, crop filter, and expandable disease details work.
- [ ] English/Luganda switching updates the interface and disease content.
- [ ] Larger-text setting toggles and persists after reload.
- [ ] About shows model readiness, cache/model size, backend, inference duration, and online/offline status.

### Offline and PWA

- [ ] While online, wait for **Model ready, works offline**.
- [ ] Install the PWA and reopen it at least once while online.
- [ ] Switch to airplane mode and reopen the app.
- [ ] Confirm the app shell, guide, saved scans, and a new on-device diagnosis remain usable.
- [ ] Restore network and verify the app can receive service-worker updates.

## Model performance and limitations

The currently deployed cassava model was reported with the following held-out test results:

| Measure | Recorded result |
|---|---:|
| Held-out test images | 1,885 |
| Accuracy | 70.98% |
| Macro F1 | 0.6235 |
| Weighted F1 | 0.7108 |
| Average inference time in the reported evaluation | 3.87 ms/image |
| Exported `.keras` model size in the reported evaluation | 9.26 MiB |

These results describe one held-out evaluation, not a promise of performance in farms or on every phone. Accuracy can vary with the camera, lighting, leaf age, variety, background, disease severity, geography, and whether field conditions resemble training images. The displayed inference time varies with the device, browser, backend, thermal state, and model warm-up.

The model always ranks among its known classes; it does not independently establish that an image belongs to one of those classes. The score threshold reduces some low-confidence results but does not make the classifier a validated unknown-crop detector. Confirm serious, widespread, or uncertain symptoms with an extension officer.

## Photo credits

The landing-page photographs are included locally in `public/images/`; the app does not load them from Wikimedia at runtime. They are licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/):

- “A farmer with her workers harvesting cassava” by **Emmanuel Ssekaggo**: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:A_farmer_with_her_workers_harvesting_cassava.jpg).
- “A farmer with her workers harvesting cassava 01” by **Emmanuel Ssekaggo**: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:A_farmer_with_her_workers_harvesting_cassava_01.jpg).
- “A woman organising the sucks to plant” by **Ph scale 56**: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:A_woman_organising_the_sucks_to_plant.jpg).

## License and contributions

No project-level `LICENSE` file is currently included. Do not assume that the application source, cassava model weights, training dataset, or individual data artifacts share the landing photographs' Creative Commons license. Confirm the applicable terms for each resource before redistributing it.

When changing the app, keep the browser model, labels, disease-guide IDs, translations, cache version, and service-worker asset paths consistent. Run `npm run build` after code changes and perform the manual checks relevant to the change before publishing.
