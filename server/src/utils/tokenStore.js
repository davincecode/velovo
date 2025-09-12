// In-memory token store for demo. Replace with DB for production.
class TokenStore {
    constructor() {
        this.tokens = {};
    }

    save(athleteId, tokenData) {
        this.tokens[String(athleteId)] = tokenData;
    }

    get(athleteId) {
        return this.tokens[String(athleteId)];
    }

    delete(athleteId) {
        delete this.tokens[String(athleteId)];
    }
}

export const tokenStore = new TokenStore();
