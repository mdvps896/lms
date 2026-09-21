import { NextResponse } from 'next/server';
import path from 'path';
import { saveToLocalStorage } from '@/utils/localStorage';
import { requireAuth } from '@/utils/apiAuth';

// 🔒 SECURITY: this endpoint had no authentication, no file-type allowlist and
// no size limit, and was additionally listed as a PUBLIC route in
// middleware.js. Anyone on the internet could write arbitrary files into
// /public — including an .svg containing <script>, which the file-serving
// route then handed back as image/svg+xml on this app's own origin: stored XSS
// with no account required.

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Raster images only. SVG is deliberately excluded: it is an executable
// document, not a picture.
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif'
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

export const POST = async (req) => {
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const field = formData.get('field');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No files received.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, message: 'File is too large (10 MB maximum).' },
        { status: 413 }
      );
    }

    const originalName = typeof file.name === 'string' ? file.name : 'upload';
    const extension = path.extname(originalName).toLowerCase();

    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(extension)) {
      return NextResponse.json(
        { success: false, message: 'Only JPG, PNG, GIF, WEBP and AVIF images may be uploaded.' },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Build the stored name ourselves from the basename only — never let a
    // client-supplied name contribute path segments.
    const safeStem = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80) || 'upload';
    const filename = `${Date.now()}_${safeStem}${extension}`;

    // Determine upload directory based on field
    let uploadSubDir = 'questions'; // default
    if (field && ['siteLogo', 'siteFavIcon', 'siteSmallLogo', 'digitalSignature'].includes(field)) {
      uploadSubDir = 'settings';
    }

    // Prepare for Local Storage
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const fileData = `data:${mimeType};base64,${base64}`;

    try {
      const result = await saveToLocalStorage(fileData, uploadSubDir, filename);

      // Return appropriate response format matching previous implementation
      // Previous implementation returned: { success: true, url: ..., message: ... } for field case
      // and { message: 'Success', url: ... } for other case.

      const responseUrl = result.url;

      if (field) {
        return NextResponse.json({
          success: true,
          url: responseUrl,
          publicId: result.publicId,
          message: 'File uploaded successfully'
        }, { status: 201 });
      }

      return NextResponse.json({
        success: true,
        message: 'Success',
        url: responseUrl,
        publicId: result.publicId
      }, { status: 201 });

    } catch (uploadError) {
      console.error('Local upload error', uploadError);
      return NextResponse.json({
        success: false,
        message: 'Failed',
        error: uploadError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error occurred ', error);
    return NextResponse.json({
      success: false,
      message: 'Failed',
      error: error.message
    }, { status: 500 });
  }
};
