import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';
import Subject from '@/models/Subject';

export async function GET(request) {
    try {
        await connectDB();

        // Get user info from cookie/session
        const userCookie = request.cookies.get('user')?.value;
        if (!userCookie) {
            return Response.json({ 
                success: false, 
                message: 'Not authenticated' 
            }, { status: 401 });
        }

        const currentUser = JSON.parse(userCookie);
        
        // Get user with populated category
        const user = await User.findById(currentUser._id)
            .populate('category')
            .select('category');

        if (!user) {
            return Response.json({ 
                success: false, 
                message: 'User not found' 
            }, { status: 404 });
        }

        // If user has a category, fetch subjects for that category
        let subjects = [];
        if (user.category) {
            subjects = await Subject.find({ 
                category: user.category._id,
                status: 'active'
            }).sort({ name: 1 });
        }

        return Response.json({ 
            success: true, 
            data: {
                category: user.category,
                subjects: subjects
            }
        });

    } catch (error) {
        console.error('Category subjects fetch error:', error);
        return Response.json({ 
            success: false, 
            message: 'Internal server error' 
        }, { status: 500 });
    }
}
