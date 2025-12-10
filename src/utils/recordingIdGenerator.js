/**
 * Recording ID Generator for Exam System (Client-Side Version)
 * Generates unique 15-digit IDs for exam recordings
 * 
 * Format: [type]-[userPart]-[examPart]-[separator]-[sequence]
 * Example: sc-3hr-j8e-#@-1 (Screen recording)
 *         vd-h88-38n-#@-2 (Video recording)
 * 
 * Note: This is the client-side version without MongoDB dependencies
 */

/**
 * Generate unique recording ID
 * @param {string} type - 'sc' for screen or 'vd' for video
 * @param {string} userId - User ID
 * @param {string} examId - Exam ID
 * @returns {Promise<string>} - Formatted recording ID (15 digits)
 */
export async function generateRecordingId(type, userId, examId) {
    try {
        // Type prefix (sc or vd)
        const typePrefix = type;
        
        // Get first 3 letters of user ID (convert to lowercase alphanumeric)
        const userPart = extractAlphanumeric(userId, 3);
        
        // Get first 3 letters of exam ID (convert to lowercase alphanumeric)
        const examPart = extractAlphanumeric(examId, 3);
        
        // Separator
        const separator = '#@';
        
        // Get sequence number (client-side uses timestamp-based)
        const sequence = getNextSequenceNumber();
        
        // Construct ID
        const recordingId = `${typePrefix}-${userPart}-${examPart}-${separator}-${sequence}`;
        
        // Validate length (should be around 15 characters)
        if (recordingId.length > 15) {
            console.warn(`Recording ID too long: ${recordingId.length} characters`);
        }
        
        return recordingId;
    } catch (error) {
        console.error('Error generating recording ID:', error);
        // Fallback ID
        return generateFallbackId(type, 1);
    }
}

/**
 * Extract alphanumeric characters from string
 * @param {string} str - Input string
 * @param {number} length - Desired length
 * @returns {string} - Alphanumeric substring
 */
function extractAlphanumeric(str, length) {
    if (!str) {
        return generateRandomAlphanumeric(length);
    }
    
    // Remove non-alphanumeric characters and convert to lowercase
    const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    if (cleaned.length >= length) {
        return cleaned.substring(0, length);
    } else {
        // Pad with random alphanumeric if not enough characters
        return (cleaned + generateRandomAlphanumeric(length - cleaned.length)).substring(0, length);
    }
}

/**
 * Generate random alphanumeric string
 * @param {number} length - Desired length
 * @returns {string} - Random alphanumeric string
 */
function generateRandomAlphanumeric(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Global counter to ensure uniqueness within the same session
let sequenceCounter = 0;

/**
 * Get next sequence number for recording ID (client-side version)
 * @returns {number} - Next sequence number
 */
function getNextSequenceNumber() {
    try {
        // Increment counter and wrap around at 9
        sequenceCounter = (sequenceCounter % 9) + 1;
        return sequenceCounter;
    } catch (error) {
        console.error('Error getting sequence number:', error);
        return 1; // Fallback to 1
    }
}

/**
 * Generate fallback ID if main generation fails
 * @param {string} type - 'sc' for screen or 'vd' for video
 * @param {number} sequence - Sequence number
 * @returns {string} - Fallback ID
 */
function generateFallbackId(type, sequence) {
    const typePrefix = type;
    const randomPart = generateRandomAlphanumeric(8);
    return `${typePrefix}-${randomPart.substring(0,3)}-${randomPart.substring(3,6)}-#@-${sequence}`;
}

/**
 * Validate recording ID format
 * @param {string} id - Recording ID to validate
 * @returns {boolean} - True if valid format
 */
export function validateRecordingId(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    
    // Expected format: type-user-exam-#@-seq
    const parts = id.split('-');
    
    // Should have exactly 5 parts
    if (parts.length !== 5) {
        return false;
    }
    
    const [type, userPart, examPart, separator, sequence] = parts;
    
    // Validate type
    if (!['sc', 'vd'].includes(type)) {
        return false;
    }
    
    // Validate user and exam parts (should be 3 alphanumeric chars)
    if (!/^[a-z0-9]{3}$/.test(userPart) || !/^[a-z0-9]{3}$/.test(examPart)) {
        return false;
    }
    
    // Validate separator
    if (separator !== '#@') {
        return false;
    }
    
    // Validate sequence (should be single digit 1-9)
    if (!/^\d$/.test(sequence) || sequence === '0') {
        return false;
    }
    
    // Check overall length (should be exactly 15 characters)
    if (id.length !== 15) {
        return false;
    }
    
    return true;
}

/**
 * Parse recording ID into components
 * @param {string} id - Recording ID to parse
 * @returns {object|null} - Parsed components or null if invalid
 */
export function parseRecordingId(id) {
    if (!validateRecordingId(id)) {
        return null;
    }
    
    const parts = id.split('-');
    const [type, userPart, examPart, separator, sequence] = parts;
    
    return {
        type,
        userPart,
        examPart,
        separator,
        sequence: parseInt(sequence),
        fullId: id
    };
}

/**
 * Generate filename for recording with ID
 * @param {string} recordingId - Recording ID
 * @param {string} type - File type ('sc' or 'vd')
 * @param {string} extension - File extension (default: 'webm')
 * @returns {string} - Complete filename
 */
export function generateRecordingFilename(recordingId, type, extension = 'webm') {
    if (!recordingId || !type) {
        // Fallback filename
        const timestamp = Date.now();
        return `recording-${type}-${timestamp}.${extension}`;
    }
    
    return `${recordingId}.${extension}`;
}