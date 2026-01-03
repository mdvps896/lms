// This file ensures all models are registered in the correct order
// Import this file before any database operations to prevent "Schema hasn't been registered" errors

// Order matters: Category must be imported first as it's referenced by other models
import Category from './Category.js';
import Subject from './Subject.js';
import Question from './Question.js';
import QuestionGroup from './QuestionGroup.js';
import User from './User.js';
import Exam from './Exam.js';
import ExamAttempt from './ExamAttempt.js';
import Notification from './Notification.js';
import Settings from './Settings.js';
import FreeMaterial from './FreeMaterial.js';

// Export all models for convenience
export {
    Category,
    Subject,
    Question,
    QuestionGroup,
    User,
    Exam,
    ExamAttempt,
    Notification,
    Settings,
    FreeMaterial
};

// Also export default as an object for easy access
export default {
    Category,
    Subject,
    Question,
    QuestionGroup,
    User,
    Exam,
    ExamAttempt,
    Notification,
    Settings,
    FreeMaterial
};
