# Lab Mango docs site

Docusaurus site served at `/docs/` next to the app.

| Path | What | Edited where |
|---|---|---|
| `docs/guides/` | User guides: lab user, lab coordinator, lab admin | Here |
| `docs/developer/index.md`, `docs-workflow.md` | Developer handbook landing pages | Here |
| `docs/developer/frontend/` | Frontend docs (generated, gitignored) | `../README.md`, `../docs/` |
| `docs/developer/backend/` | Backend docs (generated, gitignored) | `lab-mango` repository |
| `scripts/sync-docs.mjs` | Copies and link-rewrites the developer docs | Here |

```bash
npm ci
npm start        # sync + preview at http://localhost:3001/docs/
npm run build    # sync + production build into build/ (fails on broken links)
```

The backend checkout is read from `LAB_MANGO_DIR` (default: `../../lab-mango`, a clone next to this repository).
Without it, the build shows a "not synced" page for the backend.

Full workflow, CI and hosting: [`docs/developer/docs-workflow.md`](docs/developer/docs-workflow.md).
