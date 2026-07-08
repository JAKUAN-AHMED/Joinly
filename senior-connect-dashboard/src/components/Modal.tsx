import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  widthClassName?: string;
}

/** Generic centered modal — backdrop click, ESC key, and the X button all close it. */
export default function Modal({
  isOpen,
  onClose,
  title,
  widthClassName = 'max-w-md',
  children,
}: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className={`relative w-full ${widthClassName} rounded-[20px] bg-card p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-page"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
