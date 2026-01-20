/**
 * Utility to generate a 15-character roll number
 * Format: [Prefix (2 chars)][13 digits]
 * Example: PK3766464755603, RM2454539907938
 */

export const generateRollNumber = (prefixOrName) => {
    let selectedPrefix = 'ST'; // Default 'ST' for Student

    if (prefixOrName) {
        if (prefixOrName.length === 2 && prefixOrName === prefixOrName.toUpperCase() && !prefixOrName.includes(' ')) {
            // Already a 2-char prefix
            selectedPrefix = prefixOrName;
        } else {
            // Extract initials from name
            const parts = prefixOrName.trim().split(/\s+/);
            if (parts.length >= 2) {
                // First letter of first name and first letter of last name
                selectedPrefix = (parts[0][0] + parts[1][0]).toUpperCase();
            } else if (parts[0].length >= 2) {
                // First two letters of the single name
                selectedPrefix = parts[0].substring(0, 2).toUpperCase();
            } else if (parts[0].length === 1) {
                // Single letter name + 'X'
                selectedPrefix = (parts[0][0] + 'X').toUpperCase();
            }
        }
    }

    // Generate 13 random digits
    let digits = '';
    for (let i = 0; i < 13; i++) {
        digits += Math.floor(Math.random() * 10).toString();
    }

    return `${selectedPrefix}${digits}`;
};

export const ensureUniqueRollNumber = async (UserModel, prefixOrName) => {
    let rollNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        rollNumber = generateRollNumber(prefixOrName);
        const existingUser = await UserModel.findOne({ rollNumber });
        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    return rollNumber;
};
