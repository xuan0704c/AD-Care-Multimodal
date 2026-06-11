class ModuleBEmotional {
    constructor(app) {
        this.app = app;
        this.faceDetection = new FaceDetection();
        this.emotionRecognition = new EmotionRecognition();
        this.audioFeatures = new AudioFeatures();
        this.videoStream = null;
        this.isActive = false;
        this.isInitialized = false;
        this.isPaused = false;
        this.currentContainer = null;
        this.videoElement = null;
        this.overlayCanvas = null;
        this.emotionBars = null;
        this.waveformCanvas = null;
        this.recBtn = null;
        this.hasStartedCollection = false;
    }

    async initializeCollection() {
        if (this.isInitialized) return;
        
        // Setup video stream
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true
            });
        } catch (e) {
            console.warn('无法访问摄像头和麦克风，多模态采集将跳过');
            this.isInitialized = true;
            return;
        }
        
        this.isInitialized = true;
        this.isActive = true;
        
        this.app.dataLogger.logEvent('multimodal_initialized', {
            timestamp: Date.now()
        });
    }

    startBackgroundCollection() {
        if (!this.isInitialized || !this.videoStream) return;
        
        this.isActive = true;
        this.isPaused = false;
        
        // Start detection and recognition in background
        if (this.videoElement) {
            this.faceDetection.startDetection(this.videoElement, () => {});
            this.emotionRecognition.startRecognition(this.videoElement, () => {});
            
            const audioStream = new MediaStream(this.videoStream.getAudioTracks());
            this.audioFeatures.startAnalysis(audioStream, () => {});
        }
        
        this.app.dataLogger.logEvent('multimodal_background_started', {
            timestamp: Date.now()
        });
    }

    pauseCollection() {
        if (!this.isActive) return;
        
        this.isPaused = true;
        this.faceDetection.stopDetection();
        this.emotionRecognition.stopRecognition();
        this.audioFeatures.stopAnalysis();
        
        this.app.dataLogger.logEvent('multimodal_paused', {
            timestamp: Date.now()
        });
    }

    resumeCollection() {
        if (!this.isInitialized || this.isActive && !this.isPaused) return;
        
        this.isActive = true;
        this.isPaused = false;
        
        if (this.videoElement) {
            this.faceDetection.startDetection(this.videoElement, (detection) => {
                if (this.overlayCanvas) {
                    this.faceDetection.drawLandmarks(this.overlayCanvas, detection);
                }
            });
            
            this.emotionRecognition.startRecognition(this.videoElement, (result) => {
                if (this.emotionBars) {
                    this.emotionRecognition.renderEmotionBars(this.emotionBars);
                }
            });
            
            const audioStream = new MediaStream(this.videoStream.getAudioTracks());
            this.audioFeatures.startAnalysis(audioStream, (features) => {
                if (features && this.audioFeatures.timeDomainArray && this.waveformCanvas) {
                    this.audioFeatures.drawWaveform(this.waveformCanvas, this.audioFeatures.timeDomainArray);
                }
            });
        }
        
        this.app.dataLogger.logEvent('multimodal_resumed', {
            timestamp: Date.now()
        });
    }

    render(container) {
        this.currentContainer = container;
        container.innerHTML = '';
        
        // 直接显示采集界面，无需点击按钮
        this.startMultimodalCollection(container);
    }

    async startMultimodalCollection(container) {
        container.innerHTML = '';
        
        // 如果还没有初始化视频流，先初始化
        if (!this.isInitialized) {
            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                    audio: true
                });
                this.isInitialized = true;
            } catch (e) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <p>无法访问摄像头和麦克风</p>
                        <p style="color: #64748b; font-size: 0.875rem;">请确保已授予权限</p>
                    </div>
                `;
                return;
            }
        }
        
        this.isActive = true;
        this.hasStartedCollection = true;
        
        // Create layout
        const layout = document.createElement('div');
        layout.className = 'face-feedback';
        
        // Video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'face-video-container';
        
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = this.videoStream;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        videoContainer.appendChild(video);
        this.videoElement = video;
        
        // Overlay canvas for landmarks
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.top = '0';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.width = '100%';
        overlayCanvas.style.height = '100%';
        overlayCanvas.width = 640;
        overlayCanvas.height = 480;
        videoContainer.appendChild(overlayCanvas);
        this.overlayCanvas = overlayCanvas;
        
        layout.appendChild(videoContainer);
        
        // Emotion bars
        const emotionBars = document.createElement('div');
        emotionBars.className = 'emotion-bars';
        layout.appendChild(emotionBars);
        this.emotionBars = emotionBars;
        
        // Audio waveform
        const waveformContainer = document.createElement('div');
        waveformContainer.className = 'waveform-container';
        const waveformCanvas = document.createElement('canvas');
        waveformCanvas.className = 'waveform-canvas';
        waveformContainer.appendChild(waveformCanvas);
        layout.appendChild(waveformContainer);
        this.waveformCanvas = waveformCanvas;
        
        container.appendChild(layout);
        
        // 设置 canvas 实际像素尺寸（支持高清屏）
        const dpr = window.devicePixelRatio || 1;
        const containerWidth = waveformContainer.clientWidth || layout.clientWidth || 320;
        waveformCanvas.width = containerWidth * dpr;
        waveformCanvas.height = 80 * dpr;
        
        // Start detection and recognition
        await this.faceDetection.startDetection(video, (detection) => {
            this.faceDetection.drawLandmarks(overlayCanvas, detection);
        });
        
        this.emotionRecognition.startRecognition(video, (result) => {
            this.emotionRecognition.renderEmotionBars(emotionBars);
        });
        
        // Start audio analysis
        const audioStream = new MediaStream(this.videoStream.getAudioTracks());
        this.audioFeatures.startAnalysis(audioStream, (features) => {
            if (features && this.audioFeatures.timeDomainArray) {
                this.audioFeatures.drawWaveform(waveformCanvas, this.audioFeatures.timeDomainArray);
            }
        });
        
        // Update status indicators
        this.updateStatusIndicators();
        
        this.app.dataLogger.logEvent('multimodal_started', {
            timestamp: Date.now()
        });
    }

    updateStatusIndicators() {
        const indicators = document.querySelectorAll('.status-item');
        indicators.forEach(indicator => {
            const stream = indicator.dataset.stream;
            if (stream === 'video' || stream === 'audio') {
                indicator.classList.add('active');
            } else if (stream === 'face') {
                setTimeout(() => indicator.classList.add('active'), 1000);
            } else if (stream === 'emotion') {
                setTimeout(() => indicator.classList.add('active'), 2000);
            }
        });
    }

    stopCollection() {
        this.isActive = false;
        
        this.faceDetection.stopDetection();
        this.emotionRecognition.stopRecognition();
        this.audioFeatures.stopAnalysis();
        
        // 不停止视频流，保持后台采集能力
        // if (this.videoStream) {
        //     this.videoStream.getTracks().forEach(track => track.stop());
        // }
        
        this.app.dataLogger.logEvent('multimodal_stopped', {
            timestamp: Date.now(),
            faceDetections: this.faceDetection.getDetectionHistory().length,
            emotionReadings: this.emotionRecognition.getEmotionHistory().length,
            audioFeatures: this.audioFeatures.getFeatureHistory().length
        });
    }

    showResults(container) {
        container.innerHTML = `
            <div class="mini-result">
                <div class="score">完成</div>
                <div class="score-label">情绪行为评估</div>
                <p>您已完成所有情绪行为评估任务</p>
                <button class="start-task-btn" onclick="adCareApp.switchModule('C')">切换到日常功能评估</button>
            </div>
        `;
        this.app.markTaskCompleted('B', 'emotional');
        this.app.dataLogger.logEvent('emotional_assessment_completed', {});
    }
}
