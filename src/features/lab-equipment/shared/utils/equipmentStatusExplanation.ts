import { refLabel } from '../../../../shared/utils/refLabel.ts';
import type { StatusTone } from '../../../../shared/status/statusTone.ts';
import { equipmentStatusLabel, equipmentStatusTone, equipmentStatusValue } from './equipmentStatus.ts';

export interface EquipmentFact { label: string; value: string; tone?: StatusTone }
export interface EquipmentStatusExplanation {
  tone: StatusTone;
  title: string;
  description: string;
  facts: EquipmentFact[];
}

const DAY = 24 * 60 * 60 * 1000;
const formatDate = (iso: string, withTime = false) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};
const daysBetween = (from: Date, to: Date) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Where the unit physically is: active placement first, then its home storage room. */
export function equipmentLocation(record: Record<string, unknown>): string | null {
  const placement = record.placement as Record<string, unknown> | null | undefined;
  if (placement) {
    const bench = refLabel(placement.bench);
    const station = refLabel(placement.station);
    const room = refLabel(placement.room);
    const note = refLabel(placement.location_note);
    const path = [room, station, bench].filter(Boolean).join(' › ');
    if (path) return path;
    if (note) return note;
  }
  const storage = refLabel(record.storage_room);
  return storage ? `Storage: ${storage}` : null;
}

/**
 * Turns the computed display_status plus loan, placement and calibration data
 * into a sentence a lab user can act on.
 */
export function explainEquipmentStatus(record: Record<string, unknown>, now: Date = new Date()): EquipmentStatusExplanation {
  const raw = record.display_status ?? record.status ?? (record.current_status as Record<string, unknown> | undefined)?.status_type;
  const value = equipmentStatusValue(raw);
  const tone = equipmentStatusTone(raw);
  const title = value ? equipmentStatusLabel(raw) : 'Unknown';
  const facts: EquipmentFact[] = [];
  const location = equipmentLocation(record);
  const owner = refLabel(record.owner) || refLabel(record.primary_owner);

  const loan = record.loan as Record<string, unknown> | null | undefined;
  let description: string;
  switch (value) {
    case 'available':
      description = location ? `Ready to assign or lend. Currently at ${location.replace(/^Storage: /, 'storage room ')}.` : 'Ready to assign or lend.';
      break;
    case 'in_use': {
      const placement = record.placement as Record<string, unknown> | null | undefined;
      const bench = refLabel(placement?.bench);
      description = bench ? `Placed on bench ${bench}${placement?.placed_at ? ` since ${formatDate(String(placement.placed_at))}` : ''}.` : 'Assigned and in use.';
      break;
    }
    case 'borrowed': {
      const borrower = refLabel(loan?.borrower_name) || refLabel(loan?.borrower) || 'a borrower';
      description = `On loan to ${borrower}${loan?.handed_over_at ? ` since ${formatDate(String(loan.handed_over_at))}` : ''}.`;
      if (loan?.purpose) description += ` Purpose: ${String(loan.purpose)}.`;
      break;
    }
    case 'maintenance':
      description = 'Being serviced. It cannot be placed or lent until its condition is restored.';
      break;
    case 'broken':
      description = 'Out of service and needs repair before it can be used again.';
      break;
    case 'lost':
      description = 'Reported lost. Mark it as found to return it to service.';
      break;
    case 'retired':
      description = 'Decommissioned and no longer in circulation.';
      break;
    case 'transferred':
      description = 'Transferred to another organisation.';
      break;
    case 'on_order':
      description = 'Ordered and awaiting delivery.';
      break;
    default:
      description = value ? `Status recorded as ${title.toLowerCase()}.` : 'No status has been recorded for this unit.';
  }

  if (location) facts.push({ label: 'Location', value: location });
  if (loan) {
    const due = loan.due_at ? new Date(String(loan.due_at)) : null;
    const overdue = Boolean(loan.overdue) || (due !== null && due < now);
    facts.push({ label: 'Borrower', value: refLabel(loan.borrower_name) || refLabel(loan.borrower) || '—' });
    if (due) {
      facts.push({
        label: overdue ? 'Overdue' : 'Due back',
        value: overdue
          ? `${plural(daysBetween(due, now) || 1, 'day')} late · was due ${formatDate(String(loan.due_at), true)}`
          : `${formatDate(String(loan.due_at), true)} · in ${plural(daysBetween(now, due), 'day')}`,
        tone: overdue ? 'danger' : undefined,
      });
    }
  } else if (owner) {
    facts.push({ label: 'Owner', value: owner });
  }
  if (record.calibration_overdue) {
    const dueAt = record.next_calibration_due_at ? ` since ${formatDate(String(record.next_calibration_due_at))}` : '';
    facts.push({ label: 'Calibration', value: `Overdue${dueAt}`, tone: 'warning' });
  } else if (record.calibration_required && record.next_calibration_due_at) {
    facts.push({ label: 'Next calibration', value: formatDate(String(record.next_calibration_due_at)) });
  }

  return { tone, title, description, facts };
}
