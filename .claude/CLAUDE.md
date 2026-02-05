# SN Mockup

A React-based mockup tool for rapidly prototyping ServiceNow platform UI. Provides high-fidelity components that match ServiceNow's Horizon design system, with a mocked JSON backend.

## Stack

- React 18 + TypeScript
- Vite (build/dev server)
- Tailwind CSS (with ServiceNow design tokens)
- React Router v6
- Lucide React (icons)
- Vercel AI SDK (multi-provider: Anthropic, OpenAI, Google, Ollama)
- TipTap (rich text editor)

## Structure

```
src/
├── components/
│   ├── sn/                    # ServiceNow UI components
│   │   ├── common/            # Button, Input, Select, Modal, Tabs, etc.
│   │   ├── Navigation/        # Header, NavMenu, AppPill, UserMenu
│   │   ├── List/              # DataTable, FilterBuilder, Pagination
│   │   ├── Form/              # SNRelatedLists
│   │   └── NowAssist/         # AI content generation (trigger, popup, field wrapper)
│   └── layout/                # AppShell wrapper
├── pages/                     # Route pages (HomePage, ListPage, FormPage)
├── api/                       # Mock API with CRUD operations
├── data/
│   ├── sample/                # Tracked sample data (ships with repo)
│   ├── tables/                # Table definitions (schema, list/form config)
│   └── recordData/            # Record arrays (gitignored, separate from definitions)
├── context/                   # React contexts (DataContext, NavContext)
├── types/                     # TypeScript type definitions
├── styles/                    # Global CSS, design tokens
└── utils/                     # Utilities (cn, fieldValue helpers)
tests/                         # Vitest tests (fieldValue, mockApi)
vite-plugins/                  # Vite dev server plugins
├── mock-api.ts              # Persists record changes to JSON files
├── sn-import.ts             # Imports tables from live ServiceNow instance
├── ai-generate.ts           # AI content generation endpoint
└── tools.ts                 # AI tool implementations (web_search)
```

## Development

### Setup

```bash
npm install
```

### Running

```bash
npm run dev
```

Opens at http://localhost:5173

### Verification

```bash
npm run test:run    # Run tests
npx tsc --noEmit    # Type check
npm run build       # Production build
```

## Key Patterns

### Component Naming
All ServiceNow components use `SN` prefix: `SNButton`, `SNInput`, `SNList`, etc.

### Adding Tables
1. Table definition (schema) goes in `src/data/tables/{table}.json`
2. Record data goes in `src/data/recordData/{table}.json` (plain `SNRecord[]` array)
3. DataContext merges definitions with records; `tables/` overrides `sample/`

### Design Tokens
ServiceNow Horizon colors/spacing defined in:
- `tailwind.config.ts` - Tailwind theme extension
- `src/styles/index.css` - CSS variables

### Type: SNRecord
Use `SNRecord` (not `Record`) for table records to avoid TypeScript built-in conflict.

### FieldValue Shape
All field values use `{value, display_value}` structure. Use helpers from `src/utils/fieldValue.ts`:
- `getDisplayValue(field)` - for UI display
- `getValue(field)` - for raw value (e.g., sys_id from references)

### Table Definitions
JSON table definitions in `src/data/tables/` drive list and form views. Key properties:
- `fields` - Field schemas (type, label, choices, references, `aiAssist` config)
- `list` - Column order, default sort, page size
- `form` - Sections with field layout
- `relatedLists` - Related records shown in form views

Record data is stored separately in `src/data/recordData/`. See `src/types/index.ts` for `TableDefinition` and `TableConfig` types.

## Environment Variables

See `.env.example` for all available variables. Key categories:
- AI provider keys (Anthropic, OpenAI, Google, Ollama)
- ServiceNow instance credentials (for table import)
- Tool API keys (Serper for web search)

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Table selector |
| `/:table/list` | ListPage | List view with filtering |
| `/:table/new` | FormPage | New record form |
| `/:table/:sysId` | FormPage | Edit record form |

## Reference

- `reference/` - Screenshots of target ServiceNow UI
- `.claude/plans/` - Architecture plan with component specs
