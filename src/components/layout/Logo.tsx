export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-ink-900 dark:bg-ink-50">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink-50 dark:text-ink-900" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19 L10 11 L14 14 L20 5" />
          <circle cx="10" cy="11" r="1.4" fill="currentColor" />
          <circle cx="14" cy="14" r="1.4" fill="currentColor" />
          <circle cx="20" cy="5" r="1.4" fill="currentColor" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight">Plot My Notes</div>
        <div className="text-xs text-ink-400 dark:text-ink-500">Track. Reflect. See.</div>
      </div>
    </div>
  );
}
