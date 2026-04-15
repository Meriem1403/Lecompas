#!/usr/bin/env python3
import os
import re

# Directory containing the components
components_dir = '/src/app/components'

# Get all .tsx files except in ui/ and figma/ subdirectories
tsx_files = []
for root, dirs, files in os.walk(components_dir):
    # Skip ui and figma directories
    if '/ui' in root or '/figma' in root:
        continue
    for file in files:
        if file.endswith('.tsx'):
            tsx_files.append(os.path.join(root, file))

print(f"Found {len(tsx_files)} files to process")

# Process each file
for filepath in tsx_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace import paths
        # For files in /src/app/components, replace @/app/components/ui/ with ./ui/
        # For files in /src/app/components/admin, replace @/app/components/ui/ with ../ui/
        
        if '/admin/' in filepath:
            # In admin subfolder
            content = re.sub(r"from\s+['\"]@/app/components/ui/", "from '../ui/", content)
            content = re.sub(r"from\s+['\"]@/app/components/admin/", "from './", content)
            content = re.sub(r"from\s+['\"]@/app/components/", "from '../", content)
        else:
            # In root components folder
            content = re.sub(r"from\s+['\"]@/app/components/ui/", "from './ui/", content)
            content = re.sub(r"from\s+['\"]@/app/components/admin/", "from './admin/", content)
            content = re.sub(r"from\s+['\"]@/app/components/", "from './", content)
        
        # Write back if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
        else:
            print(f"Skipped (no changes): {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print("Done!")
