import '../theme/global.css';
import React from 'react';

export const ChatBubble: React.FC<{role: 'user'|'assistant', text: string}> = ({ role, text }) => (
    <div style={{display:'flex',justifyContent: role==='user' ? 'flex-end':'flex-start', margin:'6px 0'}}>
        <div style={{background: role==='user' ? '#2563EB':'#F3F4F6', color: role==='user' ? 'white':'black', padding:'10px 14px', borderRadius:12, maxWidth: '78%'}}>
            {text}
        </div>
    </div>
);
