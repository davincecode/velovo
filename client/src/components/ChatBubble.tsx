import '../theme/global.css';
import React from 'react';
import ReactMarkdown from 'react-markdown';

export const ChatBubble: React.FC<{role: 'user'|'assistant', text: string}> = ({ role, text }) => {
    // Explicitly typing the style objects with React.CSSProperties resolves the linting error.
    const bubbleStyle: React.CSSProperties = {
        background: role === 'user' ? '#2563EB' : '#F3F4F6',
        color: role === 'user' ? 'white' : 'black',
        padding: '10px 14px',
        borderRadius: 12,
        maxWidth: '95%',
        wordWrap: 'break-word'
    };

    const containerStyle: React.CSSProperties = {
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
