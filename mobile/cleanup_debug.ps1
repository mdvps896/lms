
$ErrorActionPreference = 'Stop'

# Define the root directory
$rootDir = "lib"

# Define files to exclude (regex pattern for filename)
$excludePattern = "(app_logger|logger|error_handler)\.dart$"

# Get all Dart files recursively
$files = Get-ChildItem -Path $rootDir -Filter "*.dart" -Recurse

foreach ($file in $files) {
    # Skip excluded files
    if ($file.Name -match $excludePattern) {
        Write-Host "Skipping utility file: $($file.Name)"
        continue
    }

    try {
        # Read file content
        $content = Get-Content -Path $file.FullName -Raw
        
        if ($null -eq $content) { continue }

        # Split into lines
        $lines = $content -split '\r?\n'
        
        # Filter out lines containing debugPrint with typical indentation
        # We look for lines that consist primarily of debugPrint(...)
        $newLines = $lines | Where-Object { 
            $_ -notmatch '^\s*debugPrint\s*\(' 
        }
        
        # Join lines back
        $newContent = $newLines -join "`r`n"
        
        # Check if changes were made (comparing length is a quick proxy, or strictly string compare)
        if ($content.Length -ne $newContent.Length) {
            # Write back to file
            Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
            Write-Host "Cleaned: $($file.Name)"
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}
