class DataLogger {
    constructor() {
        this.logs = [];
        this.db = null;
        this.dbName = 'ADCareDB';
        this.storeName = 'interactionLogs';
    }

    async init() {
        await this.initIndexedDB();
    }

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('sessionId', 'sessionId', { unique: false });
                    store.createIndex('eventType', 'eventType', { unique: false });
                }
                if (!db.objectStoreNames.contains('mediaData')) {
                    const mediaStore = db.createObjectStore('mediaData', { keyPath: 'id', autoIncrement: true });
                    mediaStore.createIndex('timestamp', 'timestamp', { unique: false });
                    mediaStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    logEvent(eventType, eventData = {}, coordinates = null) {
        const entry = {
            timestamp: window.timeSync.absoluteTimestamp(),
            relativeTime: window.timeSync.now(),
            eventType: eventType,
            eventData: eventData,
            coordinates: coordinates || this.getPointerCoordinates(),
            sessionId: window.adCareApp ? window.adCareApp.sessionManager.sessionId : 'unknown',
            url: window.location.href
        };
        
        this.logs.push(entry);
        this.saveToIndexedDB(entry);
        
        if (this.logs.length > 10000) {
            this.logs = this.logs.slice(-5000);
        }
    }

    getPointerCoordinates() {
        return {
            x: window.lastPointerX || 0,
            y: window.lastPointerY || 0
        };
    }

    async saveToIndexedDB(entry) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            await store.put(entry);
        } catch (e) {
            console.warn('IndexedDB save failed:', e);
        }
    }

    async saveMediaData(type, data, metadata = {}) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['mediaData'], 'readwrite');
            const store = transaction.objectStore('mediaData');
            await store.put({
                timestamp: window.timeSync.absoluteTimestamp(),
                type: type,
                data: data,
                metadata: metadata,
                sessionId: window.adCareApp ? window.adCareApp.sessionManager.sessionId : 'unknown'
            });
        } catch (e) {
            console.warn('Media save failed:', e);
        }
    }

    getLogs() {
        return this.logs;
    }

    exportToJSONL() {
        return this.logs.map(log => JSON.stringify(log)).join('\n');
    }

    clearLogs() {
        this.logs = [];
        if (this.db) {
            const transaction = this.db.transaction([this.storeName, 'mediaData'], 'readwrite');
            transaction.objectStore(this.storeName).clear();
            transaction.objectStore('mediaData').clear();
        }
    }
}

document.addEventListener('mousemove', (e) => {
    window.lastPointerX = e.clientX;
    window.lastPointerY = e.clientY;
});

document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        window.lastPointerX = e.touches[0].clientX;
        window.lastPointerY = e.touches[0].clientY;
    }
}, { passive: true });
