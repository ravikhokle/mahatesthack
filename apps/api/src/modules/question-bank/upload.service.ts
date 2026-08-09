import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

import type { MultipartFile } from '@fastify/multipart';

import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}

export class UploadService {
  async saveImage(file: MultipartFile): Promise<{ url: string; filename: string }> {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400, 'INVALID_FILE');
    }

    const uploadsDir = path.resolve(env.UPLOAD_DIR);
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${randomUUID()}${extensionForMime(file.mimetype)}`;
    const filepath = path.join(uploadsDir, filename);

    let size = 0;
    file.file.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BYTES) {
        file.file.destroy();
      }
    });

    try {
      await pipeline(file.file, createWriteStream(filepath));
    } catch {
      throw new AppError('Failed to store uploaded file', 400, 'UPLOAD_FAILED');
    }

    if (size > MAX_BYTES) {
      throw new AppError('Image must be 5MB or smaller', 400, 'FILE_TOO_LARGE');
    }

    return {
      filename,
      url: `/uploads/${filename}`,
    };
  }
}
