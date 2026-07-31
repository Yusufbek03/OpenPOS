import type { Product } from '@/types';
import { useCartStore } from '@/stores/cart-store';
import { API_BASE } from '@/lib/api-config';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, padding: 16, overflowY: 'auto', flex: 1 }}>
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => addItem(product)}
          style={{
            height: 140, borderRadius: 16, border: '1px solid #E5E7EB', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#FFFFFF', transition: 'all 0.15s', overflow: 'hidden', padding: 12,
          }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.nameRu} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36 }}>📦</span>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {product.nameRu}
            </span>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>
              {Number(product.price).toLocaleString('uz-UZ')} сўм
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
