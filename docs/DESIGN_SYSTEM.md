# LabMango colour system

All colours live in `src/shared/styles/tokens.css` as `--lm-*` variables with a
light and a dark value. Components never hard-code colours and never check the
theme; antd's theme in `src/App.tsx` mirrors the same values.

## Rules

1. **Neutral first.** Pages, cards, tables, borders and text use the neutral
   tokens (`--lm-bg`, `--lm-surface*`, `--lm-text*`, `--lm-border*`).
2. **One brand accent: teal** (`--lm-primary*`). Use it for primary buttons,
   links, focus rings, selection, the active navigation item and "today".
   Only one filled primary button per toolbar.
3. **Status colours mean status — nothing else.** `success`, `info`, `violet`,
   `warning`, `danger`, `neutral` are only for things that have a state
   (badges, overview tiles, alerts, meters). Do not use them for headings,
   labels, icons, entity types, table-column accents or decorative borders.
4. **Entity types (room, station, bench, equipment, license) are told apart by
   icon, not colour.**
5. **Charts** use `--lm-chart-1..8` (teal first) via `useChartTheme()`; status
   charts use the status tones so a colour means the same thing everywhere.

## Status tones

| Tone      | Meaning                          | Examples                                   |
|-----------|----------------------------------|--------------------------------------------|
| success   | ready to use                     | Available, Operational, Paid, Approved     |
| info      | busy but healthy                 | In use, Planned, Ordered, In progress      |
| violet    | committed or access-limited      | Reserved, Borrowed, Closed, Restricted     |
| warning   | needs attention soon             | Maintenance, Calibration overdue, Pending  |
| danger    | not usable, needs action         | Broken, Out of service, Lost, Overdue      |
| neutral   | out of circulation / unknown     | Retired, Transferred, Draft, Cancelled     |

The mapping lives in `src/shared/status/statusTone.ts`; render statuses with
`<StatusBadge>` (`src/shared/components/StatusBadge.tsx`).

## Palette

| Token            | Light     | Dark      |
|------------------|-----------|-----------|
| `--lm-bg`        | `#f4f6f8` | `#0b1117` |
| `--lm-surface`   | `#ffffff` | `#121a22` |
| `--lm-border`    | `#e2e8ee` | `#233040` |
| `--lm-text`      | `#14202b` | `#e6edf3` |
| `--lm-primary`   | `#0d8a7e` | `#2bb3a3` |

Dark mode uses navy-slate surfaces rather than pure grey, and text on the dark
teal primary is dark (`--lm-on-primary`) for contrast.

Seasonal decorations (the Tết header artwork) and the dashboard's "paper" cards
are intentional exceptions; in dark mode the paper cards use slate surfaces.
