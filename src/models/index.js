// Central models registry to ensure all models are registered in the correct order
// Import this file before using any models to prevent "Schema hasn't been registered" errors

// Import models in dependency order - Category must be imported before models that reference it
import './Category.js';
import './User.js';
import './Subject.js';
import './Question.js';
import './QuestionGroup.js';
import './Exam.js';
import './ExamAttempt.js';
import './Notification.js';
import './Settings.js';

// Re-export models for convenience
export { default as Category } from './Category.js';
export { default as User } from './User.js';
export { default as Subject } from './Subject.js';
export { default as Question } from './Question.js';
export { default as QuestionGroup } from './QuestionGroup.js';
export { default as Exam } from './Exam.js';
export { default as ExamAttempt } from './ExamAttempt.js';
export { default as Notification } from './Notification.js';
export { default as Settings } from './Settings.js';
