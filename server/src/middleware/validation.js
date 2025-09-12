export const validateRefreshToken = (req, res, next) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(400).json({ error: 'Missing refresh_token' });
    }
    next();
};

export const validateChatMessages = (req, res, next) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing messages' });
    }
    next();
};
