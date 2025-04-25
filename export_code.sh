#!/bin/bash

# Create an output directory if it doesn't exist
mkdir -p output

# Create the output file
OUTPUT_FILE="output/app_code_export.txt"
echo "Retail Marketing Campaign ROI Calculator - Code Export" > $OUTPUT_FILE
echo "Generated on: $(date)" >> $OUTPUT_FILE
echo "=========================================================" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Function to add file content to the output
add_file() {
  local file=$1
  if [ -f "$file" ]; then
    echo "## FILE: $file" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    cat "$file" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "Added $file to export"
  else
    echo "Warning: File $file not found, skipping"
  fi
}

# Client source files
echo "=== COLLECTING CLIENT FILES ===" 
echo "=== CLIENT FILES ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Main client files
add_file "client/src/App.tsx"
add_file "client/src/main.tsx"
add_file "client/src/index.css"
add_file "client/index.html"

# Client pages
for file in client/src/pages/*.tsx; do
  add_file "$file"
done

# Client components
for file in client/src/components/*.tsx; do
  add_file "$file"
done

# Client UI components
for file in client/src/components/ui/*.tsx; do
  add_file "$file"
done

# Client hooks
for file in client/src/hooks/*.tsx; do
  add_file "$file"
done
for file in client/src/hooks/*.ts; do
  add_file "$file"
done

# Client utils/libs
for file in client/src/lib/*.ts; do
  add_file "$file"
done

# Server source files
echo "=== COLLECTING SERVER FILES ===" 
echo "=== SERVER FILES ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

add_file "server/index.ts"
add_file "server/routes.ts"
add_file "server/storage.ts"
add_file "server/vite.ts"

# Shared files
echo "=== COLLECTING SHARED FILES ===" 
echo "=== SHARED FILES ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

add_file "shared/schema.ts"

# Config files
echo "=== COLLECTING CONFIG FILES ===" 
echo "=== CONFIG FILES ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

add_file "vite.config.ts"
add_file "tailwind.config.ts"
add_file "tsconfig.json"
add_file "postcss.config.js"
add_file "drizzle.config.ts"
add_file "components.json"

echo "Code export completed! File saved as $OUTPUT_FILE"
echo "You can download this file from the Files panel."