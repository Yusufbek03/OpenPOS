import type { Category } from '@/types';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryBar({ categories, selectedCategoryId, onSelect }: CategoryBarProps) {
  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', flexShrink: 0, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          border: 'none', cursor: 'pointer', flexShrink: 0,
          background: selectedCategoryId === null ? '#2563EB' : '#F3F4F6',
          color: selectedCategoryId === null ? '#FFFFFF' : '#374151',
        }}
      >
        Все
      </button>
      {activeCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: selectedCategoryId === cat.id ? '#2563EB' : '#F3F4F6',
            color: selectedCategoryId === cat.id ? '#FFFFFF' : '#374151',
          }}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.nameRu}
        </button>
      ))}
    </div>
  );
}
