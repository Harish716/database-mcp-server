const API_URL = '/api';

const api = {
    getToken: () => localStorage.getItem('aethon_token'),
    setToken: (token) => localStorage.setItem('aethon_token', token),
    clearToken: () => {
        localStorage.removeItem('aethon_token');
        localStorage.removeItem('aethon_user');
    },

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (res.status === 401 && endpoint !== '/login') {
            this.clearToken();
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    },

    async login(email, password) {
        const res = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(res.token);
        localStorage.setItem('aethon_user', JSON.stringify(res.user));
        return res;
    },

    async getDashboard() {
        return this.request('/dashboard');
    },

    async sendAiCommand(prompt, sessionId) {
        return this.request('/ai-command', {
            method: 'POST',
            body: JSON.stringify({ prompt, sessionId })
        });
    },

    async getSessions() {
        return this.request('/chat/sessions');
    },

    async getSessionMessages(sessionId) {
        return this.request(`/chat/sessions/${sessionId}`);
    },

    async deleteSession(sessionId) {
        return this.request(`/chat/sessions/${sessionId}`, { method: 'DELETE' });
    },

    async getTables() {
        return this.request('/db-explorer/tables');
    },

    async getTableData(table) {
        return this.request(`/db-explorer/data/${table}`);
    }
};

window.api = api;
