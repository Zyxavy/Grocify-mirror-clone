# Grocify Mirror Clone

This repository is a **web-optimized mirror** of the original Grocify mobile application, built specifically to streamline QA testing and enable continuous deployment without altering the primary course repository.

## Live Demo

**Access the latest deployed version here:**  
👉 [https://grocify-mirror-clone.pages.dev/](https://grocify-mirror-clone.pages.dev/)

## 📖 Project Overview

This project is our final requirement for **Application Development and Lifecycle**. The original app is built with **React Native + Expo** and follows a [YouTube tutorial](https://www.youtube.com/watch?v=TuwcMlYAJlA).

Since we did not have admin access to the original repository to configure custom deployments, this clone was created to solve two critical challenges:

1. **Zero-Build QA Testing**: Provide a live, web-based preview for the QA team. Testers can validate features instantly on any browser, avoiding the need to build and rebuild the app on physical mobile devices for every minor iteration.
2. **Preserve the Original**: Keep the instructor's original codebase completely untouched while applying necessary web compatibility modifications.

## Source & Attribution

- **Original Repository (Fork Source):**  
  [Canatoy/IT-2C_CS-Grocify](https://github.com/Canatoy/IT-2C_CS-Grocify) (Instructor's `Production` branch)
- **Original YouTube Tutorial:**  
  [Watch here](https://www.youtube.com/watch?v=TuwcMlYAJlA)

## Key Differences from the Original

While Expo supports web deployment, it comes with limitations. This mirror includes several crucial adjustments:

- **Custom Shims & Polyfills**: Added to bridge the gap between React Native mobile modules (e.g., `@clerk/expo/native`) and web APIs.
- **UI Adjustments**: Specific components like `(tabs)/index.web.tsx` and `_layout.web.tsx` are overridden for proper web rendering.
- **Metro Web Aliases**: The `metro.config.js` is configured to resolve native-only imports to web shims on the fly.
- **Separate Cloudflare Worker Backend**: The backend logic is decoupled and deployed independently to **Cloudflare Workers**, as Cloudflare Pages only serves static assets.

## Automated CI/CD Pipeline (The `deploy.yml` Workflow)

To keep this mirror perpetually in sync with the original repo, I built a robust GitHub Actions pipeline. Here’s exactly how it works:

### 1. Trigger
- **Automated**: Fires when the developers pushes changes to the `Production` branch of the original repo (via `repository_dispatch`).
- **Manual**: Can also be triggered manually via `workflow_dispatch` for emergency updates.

### 2. Backup "Mirror-Owned" Files
Before pulling the latest changes, the workflow backs up our custom web-specific files into a temporary directory (`/tmp/mirror-owned`). This includes:
- `.github/` (workflow files)
- `metro.config.js` (our custom web alias config)
- `src/shims/` (Clerk and other native shims)
- All `*.web.ts` / `*.web.tsx` files across the project
- `src/app/(tabs)/_layout.web.tsx`
- `worker/index.ts` (Cloudflare Worker backend logic)
- `src/store/grocery-store.ts` (store modifications)
- `src/lib/server/db/client.ts` (database client adjustments)
- `wrangler.toml` (Cloudflare Worker configuration)

### 3. Sync with Instructor
The workflow fetches the instructor's repo and performs a **hard reset** to `instructor/Production`. This effectively overwrites everything with the latest mobile code.

### 4. Restore Mirror-Owned Files & Apply Web Patches
Immediately after syncing, the pipeline restores our custom files from the backup. Then, it performs additional automated patching:

- **Writes `metro.config.js`** with the necessary `resolveRequest` alias for web shims.
- **Ensures Shims Exist**: Creates `src/shims/clerk-native-shim.js` if missing.
- **Forces Web Layouts**: Overwrites `(tabs)/index.web.tsx` with a web-optimized version.
- **Strips Native Imports**: Uses `sed` to remove problematic imports like `@clerk/expo/native` from non-web files (fallback safety net).
- **Patches Reanimated**: Fixes broken imports for `react-native-reanimated` to prevent web build errors.
- **Forces SPA Mode**: Modifies `app.json` using `jq` to set `expo.web.output` to `"single"`, ensuring proper client-side routing on Cloudflare Pages.

### 5. Deploy to Cloudflare Pages
The final, patched code is force-pushed to the `main` branch of this mirror. The **Cloudflare Pages** integration automatically picks up the changes and deploys the static build to the live URL.

### 6. The Backend (Cloudflare Workers)
Since the frontend is hosted on static Cloudflare Pages, the backend API logic found in `/worker` is deployed separately as a **Cloudflare Worker**. The `wrangler.toml` file is backed up and restored during the sync to ensure the Worker's configuration stays intact and is always aligned with the web frontend.

---

**This entire process runs in ~3–4 minutes**, allowing the QA team to test the latest features almost immediately after the instructor pushes new code.

## Documentation

For detailed setup instructions, architecture diagrams, and contribution guidelines, please refer to the internal documentation:  
👉 [Read the docs here](./docs/)
