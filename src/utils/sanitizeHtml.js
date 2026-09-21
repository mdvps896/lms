import sanitize from 'sanitize-html';

/**
 * Sanitizer for rich-text HTML authored in the admin/teacher editors
 * (Jodit / Quill) and rendered with dangerouslySetInnerHTML.
 *
 * 🔒 SECURITY: this HTML used to be injected raw. Question text, exam
 * instructions and the registration terms are all authored by teachers/admins
 * and rendered in other users' browsers — including an admin's — so a script
 * tag in a question body was a straight path from teacher to admin takeover,
 * and user-uploaded SVG could do the same.
 *
 * Uses `sanitize-html` (htmlparser2-based, pure JS) rather than DOMPurify:
 * DOMPurify needs a DOM, and the isomorphic build drags in jsdom, which fails
 * during Next's static prerender (it tries to read a stylesheet off disk that
 * isn't in the server bundle). This runs identically on the server and in the
 * browser with no DOM.
 */

// Formatting the editors legitimately produce. Deliberately excludes script,
// iframe, object, embed, form, svg and anything else that can execute.
const options = {
    allowedTags: [
        'p', 'br', 'hr', 'div', 'span',
        'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'mark', 'small',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
        'a', 'img', 'figure', 'figcaption'
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'width', 'height', 'style'],
        '*': ['class', 'style', 'title', 'colspan', 'rowspan', 'align']
    },
    // Only these URL schemes may appear in href/src — blocks javascript: and
    // data: payloads.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    // Inline styles are kept for editor formatting, but restricted to
    // presentational properties so `style` can't be used to smuggle a URL.
    allowedStyles: {
        '*': {
            color: [/^[^;{}()]*$/],
            'background-color': [/^[^;{}()]*$/],
            'text-align': [/^left$|^right$|^center$|^justify$/],
            'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%|pt)$/],
            'font-weight': [/^\d{3}$|^normal$|^bold$/],
            'font-style': [/^normal$|^italic$/],
            'text-decoration': [/^[a-z\s-]+$/],
            width: [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
            height: [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/]
        }
    },
    // External links shouldn't be able to reach back via window.opener.
    transformTags: {
        a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer' })
    },
    disallowedTagsMode: 'discard'
};

/**
 * @param {string} dirty raw HTML from the database
 * @returns {string} HTML safe to pass to dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty) {
    if (typeof dirty !== 'string' || dirty.length === 0) return '';
    return sanitize(dirty, options);
}

/** Convenience for JSX: `<div {...sanitizedHtmlProps(value)} />` */
export function sanitizedHtmlProps(dirty) {
    return { dangerouslySetInnerHTML: { __html: sanitizeHtml(dirty) } };
}
