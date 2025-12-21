import { NextResponse } from 'next/server';
import path from 'path';
import { saveToLocalStorage } from '@/utils/localStorage';

export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const field = formData.get('field');

    if (!file) {
      return NextResponse.json({ error: 'No files received.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + '_' + file.name.replaceAll(' ', '_');

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
