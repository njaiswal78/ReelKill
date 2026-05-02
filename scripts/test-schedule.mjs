// Self-contained truth-table test for the schedule logic.
// Re-implements the function inline so we can test it without a TS loader.

function isScheduleActive(sched, now) {
  if (!sched.enabled) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();
  const yesterday = (today + 6) % 7;
  if (sched.startMinutes <= sched.endMinutes) {
    return (
      sched.days.includes(today) &&
      minutes >= sched.startMinutes &&
      minutes < sched.endMinutes
    );
  }
  if (minutes >= sched.startMinutes && sched.days.includes(today)) return true;
  if (minutes < sched.endMinutes && sched.days.includes(yesterday)) return true;
  return false;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function at(day, hh, mm) {
  // Build a Date so getDay/getHours/getMinutes return what we want.
  // Pick a recent week starting Sunday Mar 1, 2026 (getDay=0 for Sunday).
  const base = new Date(2026, 2, 1, hh, mm); // Sun Mar 1 2026
  base.setDate(base.getDate() + day);
  return base;
}

const cases = [
  // ───────── Same-day window: Mon-Fri 09:00-17:00 ─────────
  ['Mon-Fri 9-5', { enabled: true, days: [1, 2, 3, 4, 5], startMinutes: 540, endMinutes: 1020 }, [
    [at(0, 12, 0), false, 'Sun 12:00 → idle (Sun not in days)'],
    [at(1, 8, 59), false, 'Mon 08:59 → idle (before start)'],
    [at(1, 9, 0), true,  'Mon 09:00 → active'],
    [at(1, 16, 59), true, 'Mon 16:59 → active'],
    [at(1, 17, 0), false, 'Mon 17:00 → idle (>= end)'],
    [at(5, 12, 0), true,  'Fri 12:00 → active'],
    [at(6, 12, 0), false, 'Sat 12:00 → idle (Sat not in days)'],
  ]],
  // ───────── Overnight window: Mon-Fri 22:00-06:00 ─────────
  ['Mon-Fri 22-6 (overnight)', { enabled: true, days: [1, 2, 3, 4, 5], startMinutes: 1320, endMinutes: 360 }, [
    [at(0, 23, 0), false, 'Sun 23:00 → idle (start half, Sun not in days)'],
    [at(1, 3, 0),  false, 'Mon 03:00 → idle (end half, Sun=yesterday not in days)'],
    [at(1, 21, 59), false, 'Mon 21:59 → idle'],
    [at(1, 22, 0), true,  'Mon 22:00 → active (start half, Mon in days)'],
    [at(2, 3, 0),  true,  'Tue 03:00 → active (end half, Mon=yesterday in days)'],
    [at(2, 5, 59), true,  'Tue 05:59 → active (end half)'],
    [at(2, 6, 0),  false, 'Tue 06:00 → idle (>= end)'],
    [at(5, 23, 0), true,  'Fri 23:00 → active (start half)'],
    [at(6, 3, 0),  true,  'Sat 03:00 → active (end half, Fri=yesterday in days) ← THE FIX'],
    [at(6, 22, 0), false, 'Sat 22:00 → idle (start half, Sat not in days)'],
    [at(0, 3, 0),  false, 'Sun 03:00 → idle (end half, Sat=yesterday not in days)'],
  ]],
  // ───────── Disabled ─────────
  ['Disabled', { enabled: false, days: [1, 2, 3, 4, 5], startMinutes: 540, endMinutes: 1020 }, [
    [at(1, 12, 0), false, 'Mon 12:00 → idle (schedule disabled)'],
  ]],
  // ───────── Every-day window ─────────
  ['Daily 9-5', { enabled: true, days: [0, 1, 2, 3, 4, 5, 6], startMinutes: 540, endMinutes: 1020 }, [
    [at(0, 12, 0), true, 'Sun 12:00 → active'],
    [at(6, 12, 0), true, 'Sat 12:00 → active'],
    [at(3, 8, 0),  false, 'Wed 08:00 → idle'],
  ]],
];

let pass = 0;
let fail = 0;
for (const [groupName, sched, group] of cases) {
  console.log(`\n${groupName}`);
  for (const [date, want, label] of group) {
    const got = isScheduleActive(sched, date);
    const ok = got === want;
    const day = DAYS[date.getDay()];
    const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    console.log(`  ${ok ? '✓' : '✗'} [${day} ${hhmm}] ${label}`);
    if (ok) pass++;
    else {
      fail++;
      console.log(`     expected ${want}, got ${got}`);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
