import '../theme/global.css';
import React from 'react';
import ReactMarkdown from 'react-markdown';

export const ChatBubble: React.FC<{role: 'user'|'assistant', text: string}> = ({ role, text }) => {
    const bubbleStyle = {
        background: role === 'user' ? '#2563EB' : '#F3F4F6',
        color: role === 'user' ? 'white' : 'black',
        padding: '10px 14px',
        borderRadius: 12,
        maxWidth: '100%',
        // whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
    };

    const containerStyle = {
        display: 'flex',
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
        margin: '6px 0'
    };

    return (
        <div style={containerStyle}>
            <div style={bubbleStyle} className={role === 'assistant' ? 'markdown-content' : ''}>
                {role === 'assistant' ? <ReactMarkdown>{text}</ReactMarkdown> : text}
            </div>
        </div>
    );
};
