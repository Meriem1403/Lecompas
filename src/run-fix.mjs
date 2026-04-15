import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const componentsDir = './src/app/components';

function getAllTsxFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip ui and figma directories
      if (file !== 'ui' && file !== 'figma') {
        getAllTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = getAllTsxFiles(componentsDir);

console.log(`Found ${files.length} files to process`);

files.forEach(filePath => {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Determine if file is in admin subfolder
    const isInAdmin = filePath.includes('/admin/');
    
    if (isInAdmin) {
      // In admin subfolder - use ../ui/ and ../
      content = content.replace(/from\s+['"]@\/app\/components\/ui\//g, "from '../ui/");
      content = content.replace(/from\s+['"]@\/app\/components\/admin\//g, "from './");
      content = content.replace(/from\s+['"]@\/app\/components\//g, "from '../");
    } else {
      // In root components folder - use ./ui/ and ./
      content = content.replace(/from\s+['"]@\/app\/components\/ui\//g, "from './ui/");
      content = content.replace(/from\s+['"]@\/app\/components\/admin\//g, "from './admin/");
      content = content.replace(/from\s+['"]@\/app\/components\//g, "from './");
    }
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
    } else {
      console.log(`- Skipped: ${filePath} (no changes)`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✓ Done!');
