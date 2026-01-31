import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { requirePermission, getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const currentUser = await getAuthenticatedUser(request);

        const course = await Course.findById(id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('exams', 'name type duration totalMarks passingPercentage')
            .populate('instructor', 'name profileImage profilePicture email')
            .populate('ratings.user', 'name');

        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        const courseObj = course.toObject();

        // Calculate Ratings
        const ratings = courseObj.ratings || [];
        const totalRatings = ratings.length;
        const sumRatings = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        // Likes
        const likes = courseObj.likes || [];
        const likesCount = likes.length;

        // Check User Status
        let isLiked = false;
        let userRating = null;

        if (currentUser) {
            const userId = currentUser.id || currentUser._id?.toString();
            isLiked = likes.some(uid => uid.toString() === userId);

            userRating = ratings.find(r => {
                const rUserId = r.user?._id ? r.user._id.toString() : r.user?.toString();
                return rUserId === userId;
            });
        }

        courseObj.rating = avgRating > 0 ? avgRating.toFixed(1) : '4.5';
        courseObj.averageRating = parseFloat(avgRating.toFixed(1));
        courseObj.totalRatings = totalRatings;
        courseObj.likesCount = likesCount;
        courseObj.isLiked = isLiked;
        courseObj.userRating = userRating;
        courseObj.isRated = !!userRating;
        courseObj.language = courseObj.language || 'English';

        let readingDurationText = 'Not specified';
        if (courseObj.readingDuration) {
            const { value, unit } = courseObj.readingDuration;
            readingDurationText = `${value} ${unit}`;
        }
        courseObj.readingDurationText = readingDurationText;

        courseObj.reviews = ratings.map(r => ({
            userName: r.user?.name || 'Student',
            rating: r.rating,
            review: r.review,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'
        }));

        if (!courseObj.instructor || typeof courseObj.instructor === 'string') {
            try {
                const Settings = (await import('@/models/Settings')).default;
                const settings = await Settings.findOne();
                const adminName = settings?.general?.adminName || 'Instructor';

                const User = (await import('@/models/User')).default;
                const adminUser = await User.findOne({ role: 'ADMIN' }).select('profileImage profilePicture email');

                courseObj.instructor = {
                    _id: adminUser?._id || null,
                    name: adminName,
                    profileImage: adminUser?.profileImage,
                    profilePicture: adminUser?.profilePicture,
                    email: adminUser?.email
                };
            } catch (err) { }
        }

        const fixUrl = (url) => {
            if (typeof url === 'string' && url.startsWith('/uploads/')) {
                return `/api/storage/file${url}`;
            }
            return url;
        };

        courseObj.thumbnail = fixUrl(courseObj.thumbnail);
        courseObj.demoVideo = fixUrl(courseObj.demoVideo);

        if (courseObj.curriculum) {
            courseObj.curriculum.forEach(topic => {
                if (topic.lectures) {
                    topic.lectures.forEach(lecture => {
                        lecture.content = fixUrl(lecture.content);
                    });
                }
            });
        }

        return NextResponse.json({ success: true, data: courseObj });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PUT(request, { params }) {
    const authError = await requirePermission(request, 'manage_courses');
    if (authError) return authError;

    try {
        await dbConnect();
        const { id } = params;

        if (!id || id === 'undefined' || id === 'null') {
            return NextResponse.json({ success: false, error: 'Invalid course ID' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            return NextResponse.json({ success: false, error: 'Invalid JSON body: ' + jsonError.message }, { status: 400 });
        }

        const course = await Course.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: course });
    } catch (error) {
        console.error('❌ Course Update Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    const authError = await requirePermission(request, 'manage_courses');
    if (authError) return authError;

    try {
        await dbConnect();
        const { id } = params;

        const deletedCourse = await Course.findByIdAndDelete(id);

        if (!deletedCourse) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
