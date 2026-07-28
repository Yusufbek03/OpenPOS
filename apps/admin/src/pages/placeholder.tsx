export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{title}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-12 text-center">
        <p className="text-[var(--color-muted)]">Раздел в разработке</p>
      </div>
    </div>
  );
}
