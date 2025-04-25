#!/bin/bash

OUTPUT_FILE="app_code_export.txt"

# Clear any existing file
echo "Retail Marketing Campaign ROI Calculator - Code Export" > $OUTPUT_FILE
echo "Generated on: $(date)" >> $OUTPUT_FILE
echo "=========================================================" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Find all relevant files, and loop through them
find client server shared -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.html" | grep -v 'node_modules' | sort | while read file; do
  echo "Exporting $file..."
  echo "## FILE: $file" >> $OUTPUT_FILE
  echo '```' >> $OUTPUT_FILE
  cat "$file" >> $OUTPUT_FILE
  echo '```' >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
done

# Add config files
for config_file in vite.config.ts tailwind.config.ts tsconfig.json postcss.config.js drizzle.config.ts components.json; do
  if [ -f "$config_file" ]; then
    echo "Exporting $config_file..."
    echo "## FILE: $config_file" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    cat "$config_file" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi
done

echo "Code export completed! File saved as $OUTPUT_FILE"
echo "You can download this file from the Files panel."