#!/bin/bash
# Fix imports in component files (not in ui/ or figma/ subdirectories)

cd /
find src/app/components -name "*.tsx" -not -path "*/ui/*" -not -path "*/figma/*" -type f | while read file; do
  # Check if file contains @/app/components
  if grep -q "@/app/components" "$file"; then
    echo "Processing: $file"
    
    # Determine if file is in admin subfolder
    if echo "$file" | grep -q "/admin/"; then
      # In admin subfolder
      sed -i "s|from '@/app/components/ui/|from '../ui/|g" "$file"
      sed -i 's|from "@/app/components/ui/|from "../ui/|g' "$file"
      sed -i "s|from '@/app/components/admin/|from './|g" "$file"
      sed -i 's|from "@/app/components/admin/|from "./|g' "$file"
      sed -i "s|from '@/app/components/|from '../|g" "$file"
      sed -i 's|from "@/app/components/|from "../|g' "$file"
    else
      # In root components folder
      sed -i "s|from '@/app/components/ui/|from './ui/|g" "$file"
      sed -i 's|from "@/app/components/ui/|from "./ui/|g' "$file"
      sed -i "s|from '@/app/components/admin/|from './admin/|g" "$file"
      sed -i 's|from "@/app/components/admin/|from "./admin/|g' "$file"
      sed -i "s|from '@/app/components/|from './|g" "$file"
      sed -i 's|from "@/app/components/|from "./|g' "$file"
    fi
    
    echo "Fixed: $file"
  fi
done

echo "All files processed!"
