import { useState } from 'react';
import { Info } from 'lucide-react';
import { Modal } from './Modal';

type Props = {
  /** Title for the full-description modal. */
  title: string;
  shortDescription?: string;
  description?: string;
  /** Render the short description inline alongside the info button. */
  showShort?: boolean;
  className?: string;
};

/**
 * Shows a short description inline (optional) plus an "ⓘ" button that opens the
 * fuller description in a modal. Renders nothing if neither is provided. Used
 * for axes and tracking types, whose descriptions can run long.
 */
export function DescriptionInfo({
  title,
  shortDescription,
  description,
  showShort = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const short = shortDescription?.trim();
  const full = description?.trim();
  if (!short && !full) return null;

  return (
    <span className={['inline-flex items-center gap-1', className ?? ''].join(' ')}>
      {showShort && short && (
        <span className="text-ink-500 dark:text-ink-400">{short}</span>
      )}
      {full && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(true);
            }}
            className="inline-flex shrink-0 items-center text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200"
            aria-label={`About ${title}`}
            title={`About ${title}`}
          >
            <Info size={14} />
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title={title}>
            <div className="space-y-3 text-sm">
              {short && !full?.startsWith(short) && (
                <p className="font-medium text-ink-700 dark:text-ink-200">{short}</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed text-ink-700 dark:text-ink-200">
                {full}
              </p>
            </div>
          </Modal>
        </>
      )}
    </span>
  );
}
