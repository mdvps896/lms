import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/utils/cloudinary';

export async function POST(request) {
    try {
        const { testType, fileName } = await request.json();
        
        if (testType === 'video') {
            // Create a mock video file (base64 encoded small video for testing)
            const mockVideoBase64 = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmU6yCAR9DtnVTrIHmTbuMU6uEGlS...'; // truncated for brevity
            
            const result = await uploadToCloudinary(
                mockVideoBase64,
                'test-videos',
                'video',
                fileName || 'test-video.webm'
            );
            
            return NextResponse.json({
                success: true,
                message: 'Video upload test completed',
                result,
                enhanced: true
            });
        }
        
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    } catch (error) {
        console.error('Test upload error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}