import axios from 'axios';
import config from '../config/config.js'; // Import the configuration

export const handleChatRequest = async (req, res) => {
    const { systemPrompt, messages } = req.body;

    try {
        const payload = {
            model: 'gpt-4o-mini',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ],
            max_tokens: 700,
            temperature: 0.2
        };

        const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
            headers: {
                Authorization: `Bearer ${config.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const assistantText = openaiRes.data?.choices?.[0]?.message?.content ?? '';
        return res.json({ text: assistantText, raw: openaiRes.data });
    } catch (err) {
        console.error('OpenAI proxy error', err?.response?.data || err.message);
        return res.status(500).json({ error: 'AI proxy failed' });
    }
};
