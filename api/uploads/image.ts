import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;

  if (req.method !== 'POST') return error(res, 'POST only', 405, origin);

  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return error(res, 'Expected multipart/form-data', 400, origin);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return error(res, 'No boundary in content-type', 400, origin);

    const parts = parseMultipart(body, boundary);
    const filePart = parts.find((p) => p.name === 'file');
    if (!filePart) return error(res, 'No file field found', 400, origin);

    const ext = filePart.filename?.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `uploads/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, filePart.data, {
        contentType: filePart.contentType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return error(res, `Upload failed: ${uploadError.message}`, 500, origin);
    }

    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return json(res, { url: urlData.publicUrl, filename }, 200, origin);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(res, msg, 500, origin);
  }
}

interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipart(buffer: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundary = Buffer.from(`--${boundary}--`);

  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;
  let end = buffer.indexOf(boundaryBuffer, start);

  while (start > 1 && end !== -1) {
    const partData = buffer.slice(start, end);
    const headerEnd = partData.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end + boundaryBuffer.length + 2; end = buffer.indexOf(boundaryBuffer, start); continue; }

    const headerStr = partData.slice(0, headerEnd).toString('utf-8');
    const content = partData.slice(headerEnd + 4, partData.length - 2);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        contentType: contentTypeMatch?.[1]?.trim(),
        data: content,
      });
    }

    start = end + boundaryBuffer.length + 2;
    end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1 && buffer.slice(start).includes(endBoundary)) {
      end = buffer.indexOf(endBoundary, start);
    }
  }

  return parts;
}
