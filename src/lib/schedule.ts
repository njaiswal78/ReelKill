/**
 * Single source of truth for "is the deep-work schedule firing right now?".
 *
 * Always evaluated in the browser's local timezone (Date#getDay /
 * #getHours / #getMinutes return local-time values).
 *
 * Day matching is anchored to the *start* day of the window so overnight
 * schedules behave naturally:
 *
 *   Mon-Fri 22:00 → 06:00 means "every weekday evening, ending the next
 *   morning at 06:00". So:
 *     · Fri 23:30 → active   (start half, today=Fri ∈ days)
 *     · Sat 03:30 → active   (end half, yesterday=Fri ∈ days)
 *     · Sat 23:30 → idle     (start half, today=Sat ∉ days)
 *     · Sun 03:30 → idle     (end half, yesterday=Sat ∉ days)
 *     · Mon 03:30 → idle     (end half, yesterday=Sun ∉ days)
 */

import type { FocusSettings } from './storage';

export function isScheduleActive(
  settings: FocusSettings,
  now: Date = new Date(),
): boolean {
  const sched = settings.schedule;
  if (!sched.enabled) return false;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();
  const yesterday = (today + 6) % 7;

  // Same-day window (start <= end): today must be a scheduled day.
  if (sched.startMinutes <= sched.endMinutes) {
    return (
      sched.days.includes(today) &&
      minutes >= sched.startMinutes &&
      minutes < sched.endMinutes
    );
  }

  // Overnight window (start > end): split into two halves anchored on
  // the start day.
  // First half: after start time on a scheduled day.
  if (minutes >= sched.startMinutes && sched.days.includes(today)) return true;
  // Second half: before end time on the day after a scheduled day.
  if (minutes < sched.endMinutes && sched.days.includes(yesterday)) return true;
  return false;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}
