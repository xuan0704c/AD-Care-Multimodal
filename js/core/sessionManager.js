class SessionManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.consentGiven = false;
        this.consentTime = null;
        this.deviceInfo = {};
        this.startTime = null;
        this.endTime = null;
    }

    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `AD${timestamp}${random}`.toUpperCase();
    }

    async init() {
        this.collectDeviceInfo();
        this.startTime = Date.now();
        await this.saveToStorage();
    }

    collectDeviceInfo() {
        this.deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio,
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null,
            timestamp: Date.now()
        };
    }

    setConsent(given, timestamp) {
        this.consentGiven = given;
        this.consentTime = timestamp;
    }

    getMetadata() {
        return {
            sessionId: this.sessionId,
            consentGiven: this.consentGiven,
            consentTime: this.consentTime,
            startTime: this.startTime,
            endTime: this.endTime,
            deviceInfo: this.deviceInfo,
            version: '1.0.0'
        };
    }

    async saveToStorage() {
        try {
            const data = this.getMetadata();
            localStorage.setItem(`adcare_session_${this.sessionId}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Session storage failed:', e);
        }
    }

    endSession() {
        this.endTime = Date.now();
        this.saveToStorage();
    }

    clearSession() {
        try {
            localStorage.removeItem(`adcare_session_${this.sessionId}`);
        } catch (e) {
            console.warn('Session clear failed:', e);
        }
    }
}
