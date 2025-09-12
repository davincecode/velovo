// Lightweight AI service wrapper. Replace `API_KEY` usage with secure server-side calls in production.
export const AIService = {
    async chat(systemPrompt: string, messages: {role: 'user'|'assistant'|'system', content: string}[]) {
// Example: call your server endpoint which forwards to OpenAI
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, messages })
        });
        if (!res.ok) throw new Error('AI call failed');
        return res.json();
    }
};
