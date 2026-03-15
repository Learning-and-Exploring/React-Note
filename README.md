# Note Frontend

## Running locally

1. Copy the env example and adjust if your API is not on port 4000:
   ```bash
   cp .env.example .env
   # VITE_API_URL defaults to /api; keep it when using nginx or dev proxy
   ```
2. Start the backend (Docker compose under `infra/` or your own process) on port 4000.
3. Start the client:
   ```bash
   npm install
   npm run dev
   ```

The dev server proxies `/api` to `http://localhost:4000`, matching the nginx setup in `infra/nginx` that will sit in front of both services in production.


.
├── components.json
├── dist
│   ├── assets
│   │   ├── favorith-D1AJ8s5f.png
│   │   ├── geist-cyrillic-wght-normal-CHSlOQsW.woff2
│   │   ├── geist-latin-ext-wght-normal-DMtmJ5ZE.woff2
│   │   ├── geist-latin-wght-normal-Dm3htQBi.woff2
│   │   ├── home-DGhz1d49.png
│   │   ├── index-BFlDFihP.js
│   │   └── index-C2--6sFw.css
│   ├── index.html
│   ├── logo.png
│   └── notes-logo.svg
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── public
│   ├── logo.png
│   └── notes-logo.svg
├── README.md
├── src
│   ├── App.tsx
│   ├── core
│   │   ├── lib
│   │   │   └── utils.ts
│   │   ├── providers
│   │   │   └── theme-provider.tsx
│   │   ├── routes
│   │   │   └── protected-route.tsx
│   │   └── store
│   │       ├── auth-slice.ts
│   │       └── index.ts
│   ├── features
│   │   ├── auth
│   │   │   ├── auth-service.ts
│   │   │   ├── index.ts
│   │   │   └── pages
│   │   │       └── auth.tsx
│   │   └── notes
│   │       ├── components
│   │       │   ├── chat-panel.tsx
│   │       │   ├── new-page-dialog.tsx
│   │       │   ├── note-card.tsx
│   │       │   ├── notion-editor.tsx
│   │       │   ├── notion-homepage.tsx
│   │       │   ├── notion-sidebar.tsx
│   │       │   ├── notion-topbar.tsx
│   │       │   └── share-dialog.tsx
│   │       ├── context
│   │       │   ├── notes-context.tsx
│   │       │   └── notes-provider.tsx
│   │       ├── hooks
│   │       │   └── use-notes.ts
│   │       ├── index.ts
│   │       ├── pages
│   │       │   ├── Home.tsx
│   │       │   ├── note-detail.tsx
│   │       │   └── shared-note.tsx
│   │       ├── services
│   │       │   └── notes-service.ts
│   │       └── utils
│   │           ├── format-date.ts
│   │           └── notes-utils.ts
│   ├── index.css
│   ├── main.tsx
│   └── shared
│       ├── assets
│       │   └── images
│       │       ├── favorith.png
│       │       ├── home1.png
│       │       └── home2.png
│       ├── components
│       │   ├── button.tsx
│       │   └── ui
│       │       ├── alert-dialog.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── scroll-area.tsx
│       │       ├── separator.tsx
│       │       ├── textarea.tsx
│       │       └── tooltip.tsx
│       └── pages
│           └── not-found.tsx
├── tsconfig.app.json
├── tsconfig.app.tsbuildinfo
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── yarn.lock
