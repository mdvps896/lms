const fs = require('fs');
const path = require('path');

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Pattern to match console.log statements (including multiline)
        // This preserves console.error, console.warn, console.info
        const patterns = [
            // Single line console.log
            /console\.log\([^)]*\);?\s*\n?/g,
            // Multiline console.log
            /console\.log\([^)]*\n[^)]*\);?\s*\n?/g,
        ];

        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Function to recursively process files in a directory
function processDirectory(dirPath, extensions = ['.js', '.jsx']) {
    let modifiedCount = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, .next, build directories
            if (!['node_modules', '.next', 'build', '.git'].includes(file)) {
                modifiedCount += processDirectory(filePath, extensions);
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                if (removeConsoleLogs(filePath)) {
                    modifiedCount++;
                }
            }
        }
    });

    return modifiedCount;
}

// Main execution
const srcPath = path.join(__dirname, 'src');
const modifiedFiles = processDirectory(srcPath);
console.log(`✅ Removed console.log statements from ${modifiedFiles} files`);
