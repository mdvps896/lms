import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import fs from 'fs';

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
    
    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), `public/images/${uploadSubDir}`);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);

    // Return appropriate response format
    if (field) {
      return NextResponse.json({ 
        success: true,
        url: `/images/${uploadSubDir}/${filename}`,
        message: 'File uploaded successfully'
      }, { status: 201 });
    }

    return NextResponse.json({ 
      message: 'Success', 
      url: `/images/${uploadSubDir}/${filename}` 
    }, { status: 201 });

  } catch (error) {
    console.error('Error occurred ', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed', 
      error: error.message 
    }, { status: 500 });
  }
};
