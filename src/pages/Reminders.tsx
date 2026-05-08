import { useMemo, useState } from 'react';
import { ChevronLeft, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTrackingTypes } from '@/db/repo';
import { useToast } from '@/components/ui/Toast';
import {
  buildIcs,
  downloadIcs,
  safeIcsFilename,
  type RecurEnd,
  type RecurrenceRule,
  type WeekDay,
} from '@/lib/ics';
import { fromDateInputValue, toDateInputValue, todayStart } from '@/lib/date';

const DEFAULT_TITLE = 'Log entry — Plot My Notes';
const DEFAULT_BODY =
  "Time to check in. Tap the link below to log how you're feeling.";

const FOOTER = `— Plot My Notes • timtomnow • © ${new Date().getFullYear()}`;

const WEEKDAYS: { id: WeekDay; label: string }[] = [
  { id: 'MO', label: 'Mon' },
  { id: 'TU', label: 'Tue' },
  { id: 'WE', label: 'Wed' },
  { id: 'TH', label: 'Thu' },
  { id: 'FR', label: 'Fri' },
  { id: 'SA', label: 'Sat' },
  { id: 'SU', label: 'Sun' },
];

type Frequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
type EndKind = 'never' | 'count' | 'until';

const FREQ_OPTIONS: { id: Frequency; label: string }[] = [
  { id: 'NONE', label: 'One time' },
  { id: 'DAILY', label: 'Daily' },
  { id: 'WEEKLY', label: 'Weekly' },
  { id: 'MONTHLY', label: 'Monthly' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'At event time' },
  { value: 5, label: '5 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
];

export function Reminders() {
  const types = useTrackingTypes();
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [trackingTypeId, setTrackingTypeId] = useState<string>(''); // '' = homepage
  const [date, setDate] = useState<number>(todayStart());
  const [time, setTime] = useState<string>('19:00');
  const [freq, setFreq] = useState<Frequency>('NONE');
  const [byDay, setByDay] = useState<Set<WeekDay>>(new Set([weekdayToken(new Date())]));
  const [endKind, setEndKind] = useState<EndKind>('never');
  const [endCount, setEndCount] = useState<string>('30');
  const [endDate, setEndDate] = useState<number>(() => todayStart() + 90 * 24 * 60 * 60 * 1000);
  const [reminderMin, setReminderMin] = useState<number>(0);

  const link = useMemo(() => buildLink(trackingTypeId), [trackingTypeId]);

  const handleGenerate = () => {
    const start = combineDateAndTime(date, time);
    if (!start) {
      toast.show('Pick a valid date and time.', 'error');
      return;
    }

    const recurrence = freq === 'NONE' ? null : buildRecurrence(freq, byDay, buildEnd(endKind, endCount, endDate));
    if (recurrence === 'invalid') {
      toast.show('Recurrence is invalid — pick at least one weekday or change the end.', 'error');
      return;
    }
    if (freq === 'WEEKLY' && byDay.size === 0) {
      toast.show('Pick at least one day for a weekly reminder.', 'error');
      return;
    }

    const ics = buildIcs({
      title: title.trim() || DEFAULT_TITLE,
      body: body.trim(),
      url: link,
      start,
      durationMinutes: 15,
      reminderMinutesBefore: reminderMin,
      recurrence,
      footer: FOOTER,
    });
    downloadIcs(safeIcsFilename(title || 'reminder'), ics);
    toast.show('Calendar file ready — open it to add to your calendar.');
  };

  const toggleDay = (d: WeekDay) => {
    setByDay((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <div>
      <Link
        to="/settings"
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
      >
        <ChevronLeft size={16} /> Settings
      </Link>
      <PageHeader
        title="Reminders"
        subtitle="Generate a calendar file your phone can import. The schedule lives in your calendar — not here."
      />

      <div className="space-y-5">
        <section className="card p-5 space-y-4">
          <div>
            <label className="label" htmlFor="rem-title">Event title</label>
            <input
              id="rem-title"
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={DEFAULT_TITLE}
            />
          </div>
          <div>
            <label className="label" htmlFor="rem-body">Message</label>
            <textarea
              id="rem-body"
              className="input mt-1 min-h-[88px] resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={DEFAULT_BODY}
            />
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              The link and a small footer will be appended automatically.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="rem-type">Link opens to</label>
            <select
              id="rem-type"
              className="input mt-1"
              value={trackingTypeId}
              onChange={(e) => setTrackingTypeId(e.target.value)}
            >
              <option value="">Homepage</option>
              {types?.map((t) => (
                <option key={t.id} value={t.id}>
                  New entry — {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 break-all text-xs text-ink-500 dark:text-ink-400">{link}</p>
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rem-date">First occurrence</label>
              <input
                id="rem-date"
                type="date"
                className="input mt-1"
                value={toDateInputValue(date)}
                onChange={(e) => setDate(fromDateInputValue(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="rem-time">Time</label>
              <input
                id="rem-time"
                type="time"
                className="input mt-1"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="label">Repeats</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FREQ_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setFreq(o.id)}
                  className={[
                    'rounded-xl border px-3 py-2 text-sm transition',
                    freq === o.id
                      ? 'border-ink-900 bg-ink-900 text-ink-50 dark:border-ink-50 dark:bg-ink-50 dark:text-ink-900'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-700',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {freq === 'WEEKLY' && (
            <div>
              <span className="label">On these days</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((w) => {
                  const active = byDay.has(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleDay(w.id)}
                      className={['chip', active ? 'chip-active' : ''].join(' ')}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {freq !== 'NONE' && (
            <div>
              <span className="label">Ends</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['never', 'count', 'until'] as EndKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setEndKind(k)}
                    className={[
                      'rounded-xl border px-3 py-2 text-sm transition',
                      endKind === k
                        ? 'border-ink-900 bg-ink-900 text-ink-50 dark:border-ink-50 dark:bg-ink-50 dark:text-ink-900'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-700',
                    ].join(' ')}
                  >
                    {k === 'never' ? 'Never' : k === 'count' ? 'After N times' : 'Until date'}
                  </button>
                ))}
              </div>
              {endKind === 'count' && (
                <input
                  className="input mt-2 w-32"
                  type="number"
                  min={1}
                  value={endCount}
                  onChange={(e) => setEndCount(e.target.value)}
                />
              )}
              {endKind === 'until' && (
                <input
                  className="input mt-2"
                  type="date"
                  value={toDateInputValue(endDate)}
                  onChange={(e) => setEndDate(fromDateInputValue(e.target.value))}
                />
              )}
            </div>
          )}

          <div>
            <label className="label" htmlFor="rem-trigger">Notification fires</label>
            <select
              id="rem-trigger"
              className="input mt-1"
              value={reminderMin}
              onChange={(e) => setReminderMin(Number(e.target.value))}
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </section>

        <button type="button" className="btn-primary w-full" onClick={handleGenerate}>
          <CalendarPlus size={16} /> Download calendar file
        </button>

        <p className="text-xs text-ink-500 dark:text-ink-400">
          On Android, tapping the link in the reminder opens the installed app
          directly when scope matches. On iOS, taps open Safari to the same
          page (your data is shared with the installed PWA via local storage).
          To change a reminder, edit it in your calendar — or generate a new
          file here.
        </p>
      </div>
    </div>
  );
}

function combineDateAndTime(dateMs: number, hhmm: string): Date | null {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(dateMs);
  d.setHours(h, m, 0, 0);
  return d;
}

function weekdayToken(d: Date): WeekDay {
  // JS getDay: 0=Sun..6=Sat. Map to ICS tokens.
  return (['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as WeekDay[])[d.getDay()];
}

function buildEnd(kind: EndKind, count: string, dateMs: number): RecurEnd {
  if (kind === 'count') {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    return { type: 'count', count: n };
  }
  if (kind === 'until') {
    // Use end of selected day (23:59:59 local) so the last occurrence isn't cut off.
    const d = new Date(dateMs);
    d.setHours(23, 59, 59, 0);
    return { type: 'until', date: d };
  }
  return { type: 'never' };
}

function buildRecurrence(
  freq: Frequency,
  byDay: Set<WeekDay>,
  ends: RecurEnd,
): RecurrenceRule | null | 'invalid' {
  switch (freq) {
    case 'NONE':
      return null;
    case 'DAILY':
      return { freq: 'DAILY', ends };
    case 'WEEKLY':
      return { freq: 'WEEKLY', byDay: [...byDay], ends };
    case 'MONTHLY':
      return { freq: 'MONTHLY', ends };
    default:
      return 'invalid';
  }
}

function buildLink(trackingTypeId: string): string {
  const origin = window.location.origin;
  // BASE_URL is "/plot-my-notes/" in production; trailing slash is preserved.
  const base = import.meta.env.BASE_URL || '/';
  const baseTrim = base.replace(/\/$/, '');
  if (!trackingTypeId) return `${origin}${baseTrim}/`;
  return `${origin}${baseTrim}/new/${encodeURIComponent(trackingTypeId)}`;
}
