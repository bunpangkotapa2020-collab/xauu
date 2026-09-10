const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// The corrupted top is:
/*
        </div>
        {/* Content *}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
t, { useState, useEffect, useRef } from 'react';
import { X, Settings, Shield, Clock, Server, CheckCircle2, Save, AlertCircle } from 'lucide-react';
*/

const target = `        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
t, { useState, useEffect, useRef } from 'react';`;

const replacement = `import React, { useState, useEffect, useRef } from 'react';`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log("Fixed top.");
