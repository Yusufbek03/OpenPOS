import { cn } from '@openpos/ui';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]': variant === 'primary',
          'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-gray-50': variant === 'secondary',
          'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-gray-100': variant === 'ghost',
          'bg-[var(--color-danger)] text-white hover:bg-red-700': variant === 'danger',
          'bg-[var(--color-success)] text-white hover:bg-green-700': variant === 'success',
        },
        {
          'h-8 px-3 text-xs gap-1.5': size === 'sm',
          'h-10 px-4 text-sm gap-2': size === 'md',
          'h-12 px-6 text-base gap-2': size === 'lg',
          'h-14 px-8 text-lg gap-3': size === 'xl',
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
}
