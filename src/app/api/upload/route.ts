import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { successResponse, errorResponse } from '@/lib/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToUpload: File[] = [];
    if (singleFile && singleFile instanceof File && singleFile.size > 0) {
      filesToUpload.push(singleFile);
    }
    for (const f of files) {
      if (f instanceof File && f.size > 0 && !filesToUpload.includes(f)) {
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length === 0) {
      return errorResponse('No image files provided', 400);
    }

    const uploadedUrls: string[] = [];

    // Ensure local uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    for (const file of filesToUpload) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(`File ${file.name} exceeds 5MB size limit`, 400);
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return errorResponse(`File type ${file.type || 'unknown'} not supported. Allowed: JPG, PNG, WEBP, GIF`, 400);
      }

      // Read buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check if Cloudinary is configured
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret) {
        // Upload to Cloudinary REST API
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          const signaturePayload = `timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

          const cldFormData = new FormData();
          const blob = new Blob([buffer], { type: file.type });
          cldFormData.append('file', blob, file.name);
          cldFormData.append('api_key', apiKey);
          cldFormData.append('timestamp', String(timestamp));
          cldFormData.append('signature', signature);
          cldFormData.append('folder', 'campusloop');

          const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: cldFormData,
          });

          if (cldRes.ok) {
            const cldData = await cldRes.json();
            if (cldData.secure_url) {
              uploadedUrls.push(cldData.secure_url);
              continue;
            }
          }
          console.warn('Cloudinary upload returned non-OK status, falling back to local storage');
        } catch (cldErr) {
          console.warn('Cloudinary upload failed, falling back to local disk storage:', cldErr);
        }
      }

      // Default: Save to public/uploads directory
      const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
      const randomId = crypto.randomBytes(8).toString('hex');
      const safeFilename = `${Date.now()}_${randomId}${ext.toLowerCase()}`;
      const filePath = path.join(uploadsDir, safeFilename);

      await fs.writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${safeFilename}`);
    }

    return successResponse({
      url: uploadedUrls[0],
      urls: uploadedUrls,
    }, 201);
  } catch (error: any) {
    console.error('Image upload error:', error);
    return errorResponse(error?.message || 'Failed to upload image', 500);
  }
}
