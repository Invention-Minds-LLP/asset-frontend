import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

export interface DowntimeEntry {
  type: string | null;
  minutes: number | null;
  remarks: string;
}

// Mirrors PLANNED_DOWNTIME_TYPES in revenue-log.controller.ts. Planned stops are
// excluded from OEE availability; STARTUP is planned up to the rate card's standard.
export const PLANNED_DOWNTIME_TYPES = ['PLANNED', 'CALIBRATION', 'MAINTENANCE', 'NO_DEMAND'];

export const DOWNTIME_TYPE_OPTIONS = [
  { label: 'Calibration', value: 'CALIBRATION' },
  { label: 'Start-up / Warm-up', value: 'STARTUP' },
  { label: 'Planned Maintenance', value: 'MAINTENANCE' },
  { label: 'Planned Stop', value: 'PLANNED' },
  { label: 'No Demand', value: 'NO_DEMAND' },
  { label: 'Breakdown (Unplanned)', value: 'UNPLANNED' },
  { label: 'Power Outage', value: 'POWER_OUTAGE' },
  { label: 'Staff Unavailable', value: 'STAFF_UNAVAILABLE' },
];

/** Split entries into planned / unplanned minutes, applying the start-up allowance per STARTUP entry. */
export function splitDowntime(entries: DowntimeEntry[], standardStartupMinutes: number) {
  let planned = 0, unplanned = 0;
  for (const e of entries) {
    const m = Number(e.minutes ?? 0);
    if (!e.type || m <= 0) continue;
    if (e.type === 'STARTUP') {
      const p = Math.min(m, Math.max(standardStartupMinutes, 0));
      planned += p;
      unplanned += m - p;
    } else if (PLANNED_DOWNTIME_TYPES.includes(e.type)) {
      planned += m;
    } else {
      unplanned += m;
    }
  }
  return { plannedHours: planned / 60, unplannedHours: unplanned / 60 };
}

/**
 * Downtime rows for calibrations recorded that day (from /revenue-log/calibration-info).
 * Duration falls back: actual on the record → schedule estimate → asset average;
 * warm-up falls back: record → asset average → rate card standard.
 */
export function calibrationPrefillEntries(info: any, standardStartupMinutes: number): DowntimeEntry[] {
  const rows: DowntimeEntry[] = [];
  for (const c of info?.onDate ?? []) {
    const dur = c.actualDurationMinutes ?? info.estimatedDurationMinutes ?? info.avgActualDurationMinutes;
    if (dur) rows.push({ type: 'CALIBRATION', minutes: dur, remarks: 'From calibration record' });
    const startup = c.startupMinutes ?? info.avgStartupMinutes ?? (standardStartupMinutes || null);
    if (startup) rows.push({ type: 'STARTUP', minutes: startup, remarks: 'Warm-up after calibration' });
  }
  return rows;
}

/**
 * Editable list of downtime events for one daily usage log.
 * The parent owns the array; this component mutates it in place and emits entriesChange.
 */
@Component({
  selector: 'app-downtime-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, InputNumberModule, InputTextModule, TagModule],
  templateUrl: './downtime-entries.html',
  styleUrls: ['./downtime-entries.css'],
})
export class DowntimeEntries {
  @Input() entries: DowntimeEntry[] = [];
  @Input() standardStartupMinutes = 0;
  @Output() entriesChange = new EventEmitter<DowntimeEntry[]>();

  typeOptions = DOWNTIME_TYPE_OPTIONS;

  add() {
    this.entries.push({ type: null, minutes: null, remarks: '' });
    this.emit();
  }

  remove(i: number) {
    this.entries.splice(i, 1);
    this.emit();
  }

  emit() {
    this.entriesChange.emit(this.entries);
  }

  classification(e: DowntimeEntry): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } | null {
    if (!e.type) return null;
    if (e.type === 'STARTUP') {
      const m = Number(e.minutes ?? 0);
      if (m > this.standardStartupMinutes) {
        return { label: `${this.standardStartupMinutes} min planned · ${m - this.standardStartupMinutes} min loss`, severity: 'warn' };
      }
      return { label: 'Planned (excluded from OEE)', severity: 'success' };
    }
    return PLANNED_DOWNTIME_TYPES.includes(e.type)
      ? { label: 'Planned (excluded from OEE)', severity: 'success' }
      : { label: 'Unplanned (reduces OEE)', severity: 'danger' };
  }

  get totals() {
    return splitDowntime(this.entries, this.standardStartupMinutes);
  }
}
