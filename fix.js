const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/ProjectForm.tsx',
  'src/components/ResalePropertyForm.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/backdrop-blur-[a-zA-Z0-9\[\]\-]+/g, '');
  content = content.replace(/ +/g, ' ');
  fs.writeFileSync(f, content);
});
