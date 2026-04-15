/**
 * Script pour corriger automatiquement tous les imports dans les composants
 * Exécuter avec: node fix-all-imports.js
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'app', 'components');

function getAllTsxFiles(dir, fileList = [], baseDir = dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip ui and figma directories
      if (file !== 'ui' && file !== 'figma') {
        getAllTsxFiles(filePath, fileList, baseDir);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = getAllTsxFiles(componentsDir);

console.log(`Found ${files.length} files to process\n`);

let fixedCount = 0;
let skippedCount = 0;
let errorCount = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Determine if file is in admin subfolder
    const isInAdmin = filePath.includes(path.sep + 'admin' + path.sep);
    
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
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedCount++;
    } else {
      console.log(`- Skipped: ${path.relative(process.cwd(), filePath)} (no changes needed)`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${path.relative(process.cwd(), filePath)}:`, error.message);
    errorCount++;
  }
});

console.log(`\n========================================`);
console.log(`✓ Fixed: ${fixedCount} files`);
console.log(`- Skipped: ${skippedCount} files`);
console.log(`✗ Errors: ${errorCount} files`);
console.log(`========================================`);
console.log(`\nAll done! 🎉`);
