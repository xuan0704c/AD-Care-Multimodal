class TimeSync {
    constructor() {
        this.baseTime = performance.now();
        this.systemStartTime = Date.now();
    }

    now() {
        return performance.now() - this.baseTime;
    }

    absoluteTimestamp() {
        return this.systemStartTime + this.now();
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString();
    }
}

window.timeSync = new TimeSync();
