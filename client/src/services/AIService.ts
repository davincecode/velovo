export const AIService = {
    async chat(systemPrompt: string, messages: {role: 'user'|'assistant'|'system', content: string}[]) {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, messages })
        });
        if (!res.ok) throw new Error('AI call failed');
        return res.json();
    }
};
