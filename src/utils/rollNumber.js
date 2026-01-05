/**
 * Utility to generate a 15-character roll number
 * Format: [Prefix (2 chars)][13 digits]
 * Example: PK3766464755603, RM2454539907938
 */

export const generateRollNumber = (prefix) => {
    // If no prefix is provided, randomly choose between 'PK' and 'RM'
    const prefixes = ['PK', 'RM'];
    const selectedPrefix = prefix || prefixes[Math.floor(Math.random() * prefixes.length)];

    // Generate 13 random digits
    let digits = '';
    for (let i = 0; i < 13; i++) {
        digits += Math.floor(Math.random() * 10).toString();
    }

    return `${selectedPrefix}${digits}`;
};

export const ensureUniqueRollNumber = async (UserModel, prefix) => {
    let rollNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        rollNumber = generateRollNumber(prefix);
        const existingUser = await UserModel.findOne({ rollNumber });
        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    return rollNumber;
};
