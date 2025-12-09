'use client';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function RichTextEditor({ value, onChange, placeholder, maxWords }) {
    const modules = useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'header': [1, 2, 3, false] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
        ],
    }), []);

    const formats = [
        'bold', 'italic', 'underline', 'strike',
        'header',
        'list', 'bullet', 'indent',
        'color', 'background',
        'align',
        'link', 'blockquote', 'code-block'
    ];

    // Calculate word count from HTML content
    const getWordCount = (html) => {
        if (!html) return 0;
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };

    const wordCount = getWordCount(value || '');
    const isOverLimit = maxWords && wordCount > maxWords;

    // Handle change with word limit enforcement
    const handleChange = (content) => {
        if (maxWords) {
            const newWordCount = getWordCount(content);
            // Only allow change if within limit or if deleting content
            if (newWordCount <= maxWords || newWordCount < wordCount) {
                onChange(content);
            }
            // If over limit, don't update (prevents typing more)
        } else {
            onChange(content);
        }
    };

    return (
        <div className="rich-text-editor-container">
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Start typing your answer...'}
                style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '2px solid #dee2e6'
                }}
            />
            
            <div className="d-flex justify-content-between align-items-center mt-2 px-2">
                {maxWords ? (
                    <>
                        <small className={isOverLimit ? 'text-danger' : 'text-muted'}>
                            <i className="feather-info me-1"></i>
                            {isOverLimit ? 'Word limit exceeded! Please remove some words.' : 'Use formatting tools for better presentation'}
                        </small>
                        <small className={isOverLimit ? 'text-danger fw-bold' : 'text-muted'}>
                            {wordCount} / {maxWords} words
                        </small>
                    </>
                ) : (
                    <>
                        <small className="text-muted">
                            <i className="feather-edit-2 me-1"></i>
                            Use formatting tools to enhance your answer
                        </small>
                        <small className="text-muted">
                            {wordCount} words
                        </small>
                    </>
                )}
            </div>

            <style jsx global>{`
                .ql-container {
                    min-height: 250px;
                    font-size: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                }
                
                .ql-editor {
                    min-height: 250px;
                    padding: 20px;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    line-height: 1.8;
                    opacity: 1 !important;
                }
                
                .ql-editor.ql-blank::before {
                    color: #6c757d;
                    font-style: italic;
                    opacity: 0.7;
                }
                
                .ql-toolbar.ql-snow {
                    background: #f8f9fa;
                    border: 2px solid #dee2e6 !important;
                    border-bottom: 1px solid #dee2e6 !important;
                    border-radius: 8px 8px 0 0;
                    padding: 12px 8px;
                }
                
                .ql-container.ql-snow {
                    border: 2px solid #dee2e6 !important;
                    border-top: none !important;
                    border-radius: 0 0 8px 8px;
                }
                
                .ql-snow .ql-stroke {
                    stroke: #495057;
                }
                
                .ql-snow .ql-fill {
                    fill: #495057;
                }
                
                .ql-snow .ql-picker-label {
                    color: #495057;
                }
                
                .ql-snow .ql-picker-label:hover,
                .ql-snow .ql-picker-item:hover {
                    color: #0891b2;
                }
                
                .ql-snow.ql-toolbar button:hover,
                .ql-snow .ql-toolbar button:hover {
                    color: #0891b2;
                }
                
                .ql-snow.ql-toolbar button:hover .ql-stroke,
                .ql-snow .ql-toolbar button:hover .ql-stroke {
                    stroke: #0891b2;
                }
                
                .ql-snow.ql-toolbar button:hover .ql-fill,
                .ql-snow .ql-toolbar button:hover .ql-fill {
                    fill: #0891b2;
                }
                
                .ql-snow.ql-toolbar button.ql-active,
                .ql-snow .ql-toolbar button.ql-active {
                    color: #0891b2;
                }
                
                .ql-snow.ql-toolbar button.ql-active .ql-stroke,
                .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #0891b2;
                }
                
                .ql-snow.ql-toolbar button.ql-active .ql-fill,
                .ql-snow .ql-toolbar button.ql-active .ql-fill {
                    fill: #0891b2;
                }
                
                .ql-editor h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }
                
                .ql-editor h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }
                
                .ql-editor h3 {
                    font-size: 1.25em;
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }
                
                .ql-editor blockquote {
                    border-left: 4px solid #0891b2;
                    padding-left: 16px;
                    margin: 1em 0;
                    color: #495057;
                }
                
                .ql-editor code-block {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }
                
                .ql-editor a {
                    color: #0891b2;
                    text-decoration: underline;
                }
                
                .ql-editor ul, .ql-editor ol {
                    padding-left: 1.5em;
                }
                
                .ql-toolbar.ql-snow .ql-formats {
                    margin-right: 15px;
                }
            `}</style>
        </div>
    );
}
