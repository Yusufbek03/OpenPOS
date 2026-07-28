import { cn } from '@openpos/ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ className, label, error, icon, ...props }: InputProps) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{icon}</div>}
      <input
        className={cn(
          'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm',
          icon && 'pl-10',
          error && 'border-[var(--color-danger)]',
          className,
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
  </div>
);
