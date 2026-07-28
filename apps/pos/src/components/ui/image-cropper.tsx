import { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  onCropped: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ file, onCropped, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState('');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const SIZE = 1080;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!preview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = SIZE;
      canvas.height = SIZE;

      const imgRatio = img.width / img.height;
      let drawW: number, drawH: number;
      if (imgRatio > 1) {
        drawH = SIZE * scale;
        drawW = drawH * imgRatio;
      } else {
        drawW = SIZE * scale;
        drawH = drawW / imgRatio;
      }

      const x = (SIZE - drawW) / 2 + offsetX;
      const y = (SIZE - drawH) / 2 + offsetY;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, x, y, drawW, drawH);
    };
    img.src = preview;
  }, [preview, offsetX, offsetY, scale]);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onCropped(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
      <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Обрезка фото</h2>
          <button onClick={onCancel} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 240, height: 240, borderRadius: 12, overflow: 'hidden', border: '2px dashed #D1D5DB', background: '#F9FAFB' }}>
              <canvas ref={canvasRef} style={{ width: 240, height: 240 }} />
            </div>
          </div>

          {/* Zoom */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block' }}>Масштаб</label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Position */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block' }}>Влево-вправо</label>
              <input
                type="range"
                min={-200}
                max={200}
                step={5}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block' }}>Вверх-вниз</label>
              <input
                type="range"
                min={-200}
                max={200}
                step={5}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>Размер: 1080 × 1080 px</p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Отмена
            </button>
            <button onClick={handleCrop} style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#2563EB', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Обрезать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
