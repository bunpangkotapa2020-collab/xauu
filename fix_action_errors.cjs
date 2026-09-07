const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the throw new Error in reconnect_pipeline
code = code.replace(
  /throw new Error\('🔴 មិនអាច Auto-Reconnect បានទេ៖ បាត់បង់ Credentials ឬ Login ID នៅក្នុងប្រព័ន្ធ \(Backend\)'\);/g,
  "return res.status(400).json({ error: '🔴 មិនអាច Auto-Reconnect បានទេ៖ បាត់បង់ Credentials ឬ Login ID នៅក្នុងប្រព័ន្ធ (Backend)' });"
);

code = code.replace(
  /throw new Error\('MetaAPI មិនទាន់ត្រៀមរួចរាល់ ឬ ដាច់ការតភ្ជាប់។'\);/g,
  "return res.status(400).json({ error: 'MetaAPI មិនទាន់ត្រៀមរួចរាល់ ឬ ដាច់ការតភ្ជាប់។' });"
);

code = code.replace(
  /throw new Error\('🔴 Auto-Reconnect បរាជ័យ: ' \+ \(err\.message \|\| 'Unknown error'\)\);/g,
  "return res.status(400).json({ error: '🔴 Auto-Reconnect បរាជ័យ: ' + (err.message || 'Unknown error') });"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed action errors');
