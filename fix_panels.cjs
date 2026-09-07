const fs = require('fs');

function updatePanel(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Add useEffect to the import if not present
    if (!code.includes("useEffect")) {
        code = code.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect } from 'react';");
    }
    
    // Add the event listener inside the component
    const listenerCode = `
  useEffect(() => {
    const handleOpen = () => setIsExpanded(true);
    window.addEventListener('open_settings', handleOpen);
    return () => window.removeEventListener('open_settings', handleOpen);
  }, []);
`;

    // Insert it right after the state declarations
    code = code.replace(/const \[isExpanded, setIsExpanded\] = useState\(false\);/, "const [isExpanded, setIsExpanded] = useState(false);\n" + listenerCode);
    
    fs.writeFileSync(filePath, code);
}

updatePanel('src/components/RiskSettingsPanel.tsx');
updatePanel('src/components/ProtectionSettingsPanel.tsx');
