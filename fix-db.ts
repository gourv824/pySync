import fs from 'fs';

let data = fs.readFileSync('database.json', 'utf8');
try {
  JSON.parse(data);
  console.log('JSON is valid');
} catch (e: any) {
  console.log('Error:', e.message);
  
  let lastBrace = data.lastIndexOf('}');
  if (lastBrace !== -1) {
    let fixed = data.substring(0, lastBrace + 1);
    
    const suffixes = [
      ']}',
      ']}]}',
      ']}}',
      '}',
      ']} ]}',
      '',
      ']',
      '}',
      ']}',
      ']}]}'
    ];
    
    let success = false;
    for (const suffix of suffixes) {
      try {
        const parsed = JSON.parse(fixed + suffix);
        
        // Ensure all required keys are present
        const initialData = {
            projects: [],
            resaleProperties: [],
            reports: [],
            users: [],
            logs: [],
            approvals: [],
            notifications: [],
            lastUserSerial: 0,
            lastProjectSerial: 0,
            lastResalePropertySerial: 0
        };
        
        const finalData = { ...initialData, ...parsed };
        
        fs.writeFileSync('database.json', JSON.stringify(finalData, null, 2));
        console.log('Fixed by appending:', suffix);
        success = true;
        break;
      } catch (e2) {}
    }
    
    if (!success) {
        console.log("Could not fix automatically. Resetting to initial state.");
        const initialData = {
            projects: [],
            resaleProperties: [],
            reports: [],
            users: [],
            logs: [],
            approvals: [],
            notifications: [],
            lastUserSerial: 0,
            lastProjectSerial: 0,
            lastResalePropertySerial: 0
        };
        fs.writeFileSync('database.json', JSON.stringify(initialData, null, 2));
    }
  }
}
