import { auth } from './firebase';

export const AIService = {
    async chat(systemPrompt: string, messages: {role: 'user'|'assistant'|'system', content: string}[]) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is signed in.');
        }

        const token = await user.getIdToken();

        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ systemPrompt, messages })
        });

        if (!res.ok) {
            console.error('AI call failed with status:', res.status);
            const errorBody = await res.text();
            console.error('Error body:', errorBody);
            throw new Error('AI call failed');
        }

        return res.json();
    }
};
