# graph-editor

`graph-editor` is a browser-based node editor built with React Flow. It focuses only on visual editing: create blocks, connect edges, and organize workspace graphs.

## Features

- Drag-and-drop block creation from the left palette
- Connect, move, and delete nodes/edges on the canvas
- Undo/redo and fit-view keyboard shortcuts
- Multi-workspace management (create, rename, switch, delete)
- Autosave to IndexedDB
- JSON import/export for workspace snapshots

## Quick start

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start development server:

   ```bash
   bun run dev
   ```

3. Open the local URL printed by Vite.

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `bun run dev`        | Start Vite dev server          |
| `bun run build`      | Typecheck and production build |
| `bun run test`       | Run Vitest                     |
| `bun run lint`       | Oxlint with autofix            |
| `bun run lint:check` | Oxlint without writes          |
| `bun run format`     | Oxfmt                          |
| `bun run preview`    | Preview production build       |

## Keyboard shortcuts

- `Cmd/Ctrl + Z`: undo
- `Shift + Cmd/Ctrl + Z` or `Ctrl + Y`: redo
- `Delete` / `Backspace`: delete selected nodes/edges
- `Cmd/Ctrl + 0` or `F`: fit canvas to view
