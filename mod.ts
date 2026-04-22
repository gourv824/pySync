import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/p-4 sm:p-6/g, 'p-2 sm:p-4 md:p-6');
content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl sm:rounded-[32px]');
content = content.replace(/max-h-\[90vh\]/g, 'max-h-[95vh] sm:max-h-[90vh]');
fs.writeFileSync('src/App.tsx', content);
console.log('Mobile responsiveness layout changes applied!');
