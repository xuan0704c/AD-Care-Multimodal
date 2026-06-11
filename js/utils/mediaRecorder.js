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
        this.currentTaskName = '';
        this.taskSegments = [];
    }

    async requestPermissions() {
        try {
            // 复用准备阶段已获取的视频流，避免重复请求权限
            if (window.previewStream && window.previewStream.getTracks().some(t => t.readyState === 'live')) {
                this.videoStream = window.previewStream;
            } else {
                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, frameRate: 15 },
                    audio: false
                });
            }
            
            // 复用准备阶段已获取的音频流，避免重复请求权限
            if (window.previewAudioStream && window.previewAudioStream.getTracks().some(t => t.readyState === 'live')) {
                this.audioStream = window.previewAudioStream;
            } else {
                this.audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: { sampleRate: 16000, channelCount: 1 },
                    video: false
                });
            }
            
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
        return new Promise((resolve) => {
            let pending = 0;
            const complete = () => {
                if (--pending === 0) resolve();
            };

            if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
                pending++;
                const self = this;
                
                this.mediaRecorder.onstop = function() {
                    if (self.recordedChunks.length > 0) {
                        const blob = new Blob(self.recordedChunks, { type: 'video/webm' });
                        const segmentId = `video_${Date.now()}`;
                        
                        self.videoSegments.push({
                            id: segmentId,
                            blob: blob,
                            timestamp: Date.now(),
                            duration: self.segmentInterval
                        });
                        
                        window.adCareApp.dataLogger.saveMediaData('video', blob, {
                            segmentId: segmentId,
                            duration: self.segmentInterval
                        });
                        
                        self.recordedChunks = [];
                    }
                    
                    setTimeout(() => {
                        if (self.isRecording && self.videoStream) {
                            try {
                                const options = {
                                    mimeType: 'video/webm;codecs=vp8',
                                    videoBitsPerSecond: 500000
                                };
                                self.mediaRecorder = new window.MediaRecorder(self.videoStream, options);
                                self.mediaRecorder.ondataavailable = (event) => {
                                    if (event.data.size > 0) {
                                        self.recordedChunks.push(event.data);
                                    }
                                };
                                self.mediaRecorder.start(1000);
                            } catch (e) {
                                console.warn('Failed to restart video recording:', e);
                            }
                        }
                        complete();
                    }, 200);
                };
                
                this.mediaRecorder.stop();
            }

            if (this.audioMediaRecorder && this.isRecording && this.audioMediaRecorder.state === 'recording') {
                pending++;
                const self = this;
                
                this.audioMediaRecorder.onstop = function() {
                    if (self.audioChunks && self.audioChunks.length > 0) {
                        const audioBlob = new Blob(self.audioChunks, { type: 'audio/webm' });
                        const segmentId = `audio_${Date.now()}`;
                        
                        self.audioSegments.push({
                            id: segmentId,
                            blob: audioBlob,
                            timestamp: Date.now()
                        });
                        
                        window.adCareApp.dataLogger.saveMediaData('audio', audioBlob, {
                            segmentId: segmentId,
                            type: 'audio/webm'
                        });
                        
                        self.audioChunks = [];
                    }
                    
                    setTimeout(() => {
                        if (self.isRecording && self.audioStream) {
                            try {
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
                                self.audioMediaRecorder = new window.MediaRecorder(self.audioStream, options);
                                self.audioMediaRecorder.ondataavailable = (event) => {
                                    if (event.data.size > 0) {
                                        self.audioChunks.push(event.data);
                                    }
                                };
                                self.audioMediaRecorder.start(1000);
                            } catch (e) {
                                console.warn('Failed to restart audio recording:', e);
                            }
                        }
                        complete();
                    }, 200);
                };
                
                this.audioMediaRecorder.stop();
            }

            if (pending === 0) resolve();
        });
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
        
        // 清理全局流引用
        window.previewStream = null;
        window.previewAudioStream = null;
    }

    getVideoSegments() {
        return this.videoSegments;
    }

    getAudioSegments() {
        return this.audioSegments;
    }

    getTaskSegments() {
        return this.taskSegments;
    }

    startTaskRecording(taskName, taskType = '') {
        this.currentTaskName = taskName;
        this.saveTaskSegment(`${taskName}_started`, taskType);
    }

    saveTaskSegment(label, taskType = '') {
        const segmentInfo = {
            taskName: this.currentTaskName,
            label: label,
            taskType: taskType,
            timestamp: Date.now(),
            videoSegmentIds: this.videoSegments.length > 0 ? [this.videoSegments[this.videoSegments.length - 1].id] : [],
            audioSegmentIds: this.audioSegments.length > 0 ? [this.audioSegments[this.audioSegments.length - 1].id] : []
        };
        
        this.taskSegments.push(segmentInfo);
        
        if (window.adCareApp && window.adCareApp.dataLogger) {
            window.adCareApp.dataLogger.logEvent('task_segment_saved', segmentInfo);
        }
    }

    stopTaskRecording() {
        if (this.currentTaskName) {
            this.saveTaskSegment(`${this.currentTaskName}_completed`);
            this.currentTaskName = '';
        }
    }

    clearData() {
        this.videoSegments = [];
        this.audioSegments = [];
        this.taskSegments = [];
        this.recordedChunks = [];
        this.audioChunks = [];
        this.currentTaskName = '';
    }
}
