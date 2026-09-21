import { sanitizeHtml } from '@/utils/sanitizeHtml';
// Pure display/formatting helpers shared by the attempt detail page and
// its question review list. Extracted verbatim from page.js — no logic
// changes.

export const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} min ${secs} sec`;
};

// Helper function to render question text with HTML support
export const renderQuestionText = (text) => {
    if (!text) return null;

    const htmlPattern = /<[^>]+>/;
    if (htmlPattern.test(text)) {
        return (
            <div
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                style={{ lineHeight: '1.8' }}
            />
        );
    }

    return <span>{text}</span>;
};

// Helper function to check if answer contains HTML and render it
export const renderAnswer = (answer) => {
    if (!answer) return 'Not answered';

    // Check if answer contains HTML tags
    const htmlPattern = /<[^>]+>/;
    if (htmlPattern.test(answer)) {
        // Render as HTML
        return (
            <div
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(answer) }}
                style={{
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    lineHeight: '1.8'
                }}
            />
        );
    }

    // Render as plain text
    return <strong>{answer}</strong>;
};
