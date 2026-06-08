class ModuleBEmotional {
    constructor(app) {
        this.app = app;
        this.faceDetection = new FaceDetection();
        this.emotionRecognition = new EmotionRecognition();
        this.audioFeatures = new AudioFeatures();
        this.videoStream = null;
        this.isActive = false;
    }

    render(container) {
        container.innerHTML = '';
        
        const header = UIComponents.createTaskHeader(
            '情绪行为评估',
            '多模态情绪数据采集与分析'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '系统将同时采集您的面部表情、语音特征和身体姿态数据。请保持自然状态，正常完成任务即可。'
        );
        container.appendChild(instruction);
        
        const startBtn = document.createElement('button');
        startBtn.className = 'start-task-btn';
        startBtn.textContent = '开始多模态采集';
        startBtn.addEventListener('click', () => this.startMultimodalCollection(container));
        container.appendChild(startBtn);
    }

    async startMultimodalCollection(container) {
        container.innerHTML = '';
        
        // Setup video stream
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true
            });
        } catch (e) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p>无法访问摄像头和麦克风</p>
                    <p style="color: #64748b; font-size: 0.875rem;">请确保已授予权限</p>
                </div>
            `;
            return;
        }
        
        this.isActive = true;
        
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
        
        layout.appendChild(videoContainer);
        
        // Emotion bars
        const emotionBars = document.createElement('div');
        emotionBars.className = 'emotion-bars';
        layout.appendChild(emotionBars);
        
        // Audio waveform
        const waveformContainer = document.createElement('div');
        waveformContainer.className = 'waveform-container';
        const waveformCanvas = document.createElement('canvas');
        waveformCanvas.className = 'waveform-canvas';
        waveformContainer.appendChild(waveformCanvas);
        layout.appendChild(waveformContainer);
        
        // Recording button
        const recBtn = document.createElement('button');
        recBtn.className = 'recording-btn';
        recBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6"/>
            </svg>
        `;
        recBtn.addEventListener('click', () => {
            if (recBtn.classList.contains('recording')) {
                this.stopCollection();
                recBtn.classList.remove('recording');
                this.showResults(container);
            } else {
                recBtn.classList.add('recording');
            }
        });
        layout.appendChild(recBtn);
        
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
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        
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
