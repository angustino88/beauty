# LabMango colour system

All colours live in `src/shared/styles/tokens.css` as `--lm-*` variables with a
light and a dark value. Components never hard-code colours and never check the
theme; antd's theme in `src/App.tsx` mirrors the same values.

## Rules

1. **Neutral first.** Pages, cards, tables, borders and text use the neutral
   tokens (`--lm-bg`, `--lm-surface*`, `--lm-text*`, `--lm-border*`).
2. **One brand accent: violet** (`--lm-primary*`). Use it for primary buttons,
   links, focus rings, selection, the active navigation item and "today".
   Only one filled primary button per toolbar.
3. **Status colours mean status — nothing else.** `success`, `info`, `reserved`,
   `warning`, `danger`, `neutral` are only for things that have a state
   (badges, overview tiles, alerts, meters). Do not use them for headings,
   labels, icons, entity types, table-column accents or decorative borders.
4. **Entity types (room, station, bench, equipment, license) are told apart by
   icon, not colour.**
5. **Charts** use `--lm-chart-1..8` (violet first) via `useChartTheme()`; status
   charts use the status tones so a colour means the same thing everywhere.

## Status tones

| Tone      | Meaning                          | Examples                                   |
|-----------|----------------------------------|--------------------------------------------|
| success   | ready to use                     | Available, Operational, Paid, Approved     |
| info      | busy but healthy                 | In use, Planned, Ordered, In progress      |
| reserved  | committed or access-limited      | Reserved, Borrowed, Closed, Restricted     |
| warning   | needs attention soon             | Maintenance, Calibration overdue, Pending  |
| danger    | not usable, needs action         | Broken, Out of service, Lost, Overdue      |
| neutral   | out of circulation / unknown     | Retired, Transferred, Draft, Cancelled     |

The mapping lives in `src/shared/status/statusTone.ts`; render statuses with
`<StatusBadge>` (`src/shared/components/StatusBadge.tsx`).

## Palette

| Token            | Light     | Dark      |
|------------------|-----------|-----------|
| `--lm-bg`        | `#f6f5f9` | `#121317` |
| `--lm-surface`   | `#ffffff` | `#1c1d23` |
| `--lm-border`    | `#e4e1ec` | `#30323a` |
| `--lm-text`      | `#1a1723` | `#dcdde4` |
| `--lm-primary`   | `#6d3fd6` | `#7458e0` |

Light surfaces are neutrals tinted slightly towards violet, so the accent sits
on its own ground. Dark mode is tuned for comfort rather than maximum contrast:
a graphite page instead of near-black, softened text (body text about 12:1, not
16:1, which avoids letters glowing on long sessions), almost-grey neutrals so
the violet accent is the only purple on screen, and clearly stepped elevations
(page → card → header/hover → popover) so fewer borders are needed. Status
colours are slightly less saturated in dark mode so badges do not glare. Text on the primary is white in both themes. In
dark mode, buttons use `--lm-primary` and text/links use the lighter
`--lm-primary-fg`. Type is Inter (self-hosted variable font) in weights 400, 500
and 600; numbers that line up use `tabular-nums`.

## Bench activity on the dashboard

Bench activity has a fixed colour language of its own (`benchActivityTone` in
`shared/status/statusTone.ts`):

| Status      | Colour | Tone      |
| ----------- | ------ | --------- |
| Free        | green  | `success` |
| Active      | red    | `danger`  |
| Inactive    | yellow | `warning` |
| Maintaining | blue   | `info`    |
| Offline     | grey   | `neutral` |

Whether a bench is booked right now is a separate fact: it is shown as a cyan
"Booked" marker next to the status badge, never by the status colour.

## Seasons

The header carries a seasonal pack (Tết, Mid-Autumn, Christmas) defined in
`shared/season/seasons.ts`. A pack supplies a chip label, a motif and an
optional mascot, coloured only by the five `--lm-season-*` tokens that
`html[data-season]` switches. It decorates the header and nothing else: buttons,
links and status colours never change with the season. The season follows the
calendar; set `VITE_SEASON` to `tet`, `mid-autumn`, `christmas` or `none` to pin
it.

## Notifications

All user-facing feedback routes through `src/shared/notifications/` using the
`--lm-notif-*` and semantic status tokens in `tokens.css`:

| Pattern | Component / API | Use for |
|---|---|---|
| Toast | `notify.success / info / warning / error / loading` + `<ToastViewport>` | Short-lived operation feedback (create, update, delete, export, copy) |
| Inline alert | `<InlineAlert>` | Form errors, section data-load failures (with `onRetry`), contextual caveats |
| Confirmation dialog | `confirmAction(...)` / `Popconfirm` | Destructive or consequential actions requiring explicit confirmation |
| Persistent banner | `<SystemBanner>` (`NotificationBanner`, `OfflineNotification`) | System-wide announcements and connectivity / service interruptions |

Rules:
- Never call static `antd` `message.*`, `notification.*`, `Modal.confirm`, raw
  `<Alert>`, or `window.confirm` directly in feature modules.
- Auto-dismiss durations scale by severity (`success` 4s, `info` 5s, `warning`
  6.5s); `error` toasts stay visible until dismissed. Hovering or focusing a
  toast pauses its timer. Identical active toasts coalesce with a repeat badge.
- Normalize every API or network error through `normalizeApiError` /
  `getApiErrorMessage` so internal exceptions, stack traces, SQL errors, and raw
  JSON payloads are never exposed.

