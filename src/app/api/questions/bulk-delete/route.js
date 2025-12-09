import dbConnect from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export async function DELETE(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { questionIds } = body;

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return Response.json({ 
                success: false, 
                message: 'Please provide question IDs to delete' 
            }, { status: 400 });
        }

        // Validate that all IDs exist
        const existingQuestions = await Question.find({ _id: { $in: questionIds } }).select('_id');
        const existingIds = existingQuestions.map(q => q._id.toString());
        const notFound = questionIds.filter(id => !existingIds.includes(id));

        if (notFound.length > 0) {
            return Response.json({ 
                success: false, 
                message: `Questions not found: ${notFound.join(', ')}` 
            }, { status: 404 });
        }

        // Delete questions
        const result = await Question.deleteMany({ _id: { $in: questionIds } });

        return Response.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} questions`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        return Response.json({ 
            success: false, 
            message: 'Failed to delete questions' 
        }, { status: 500 });
    }
}