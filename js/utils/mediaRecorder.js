class MediaRecorder {
    constructor() {
        this.videoStream = null;
        this.audioStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.videoSegments = [];
        this.audioSegments = [];
        this.segmentInterval = 30000;
        this.segmentTimer = null;
    }

    async requestPermissions() {
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, frameRate: 15 },
                audio: false
            });
            
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1 },
                video: false
            });
            
            return { video: true, audio: true };
        } catch (e) {
            console.warn('Media permissions failed:', e);
            return { video: false, audio: false, error: e.message };
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        
        const perms = await this.requestPermissions();
        if (!perms.video && !perms.audio) {
            throw new Error('无法访问媒体设备');
        }

        this.isRecording = true;
        this.recordedChunks = [];
        
        if (this.videoStream) {
            this.startVideoRecording();
        }
        
        if (this.audioStream) {
            this.startAudioRecording();
        }

        this.segmentTimer = setInterval(() => this.saveSegment(), this.segmentInterval);
    }

    startVideoRecording() {
        const options = {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: 500000
        };
        
        try {
            this.mediaRecorder = new window.MediaRecorder(this.videoStream, options);
        } catch (e) {
            this.mediaRecorder = new window.MediaRecorder(this.videoStream);
        }
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.start(1000);
    }

    startAudioRecording() {
        // 使用 MediaRecorder 直接录制音频，避免 ScriptProcessorNode 弃用警告
        const audioMimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus'
        ];
        
        let mimeType = '';
        for (const type of audioMimeTypes) {
            if (window.MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }
        
        const options = mimeType ? { mimeType } : {};
        
        try {
            this.audioMediaRecorder = new window.MediaRecorder(this.audioStream, options);
        } catch (e) {
            this.audioMediaRecorder = new window.MediaRecorder(this.audioStream);
        }
        
        this.audioChunks = [];
        
        this.audioMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.audioMediaRecorder.start(1000);
    }

    async saveSegment() {
        if (this.recordedChunks.length > 0) {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const segmentId = `video_${Date.now()}`;
            
            this.videoSegments.push({
                id: segmentId,
                blob: blob,
                timestamp: Date.now(),
                duration: this.segmentInterval
            });
            
            await window.adCareApp.dataLogger.saveMediaData('video', blob, {
                segmentId: segmentId,
                duration: this.segmentInterval
            });
            
            this.recordedChunks = [];
        }
        
        if (this.audioChunks && this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const segmentId = `audio_${Date.now()}`;
            
            this.audioSegments.push({
                id: segmentId,
                blob: audioBlob,
                timestamp: Date.now()
            });
            
            await window.adCareApp.dataLogger.saveMediaData('audio', audioBlob, {
                segmentId: segmentId,
                type: 'audio/webm'
            });
            
            this.audioChunks = [];
        }
    }

    encodeWAV(audioData, sampleRate) {
        const flattenData = audioData.reduce((acc, arr) => {
            acc.push(...arr);
            return acc;
        }, []);
        
        const buffer = new ArrayBuffer(44 + flattenData.length * 2);
        const view = new DataView(buffer);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + flattenData.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, flattenData.length * 2, true);
        
        for (let i = 0; i < flattenData.length; i++) {
            const s = Math.max(-1, Math.min(1, flattenData[i]));
            view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        
        return new Blob([view], { type: 'audio/wav' });
    }

    async stopRecording() {
        this.isRecording = false;
        
        if (this.segmentTimer) {
            clearInterval(this.segmentTimer);
            this.segmentTimer = null;
        }
        
        await this.saveSegment();
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.audioMediaRecorder && this.audioMediaRecorder.state !== 'inactive') {
            this.audioMediaRecorder.stop();
        }
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
    }

    getVideoSegments() {
        return this.videoSegments;
    }

    getAudioSegments() {
        return this.audioSegments;
    }

    clearData() {
        this.videoSegments = [];
        this.audioSegments = [];
        this.recordedChunks = [];
        this.audioChunks = [];
    }
}
