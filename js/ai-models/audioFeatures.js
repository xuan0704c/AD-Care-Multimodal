class AudioFeatures {
    constructor() {
        this.isRunning = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.featureHistory = [];
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio feature extractor initialized (mock)');
        return true;
    }

    async startAnalysis(stream, callback) {
        if (!this.audioContext) await this.init();
        if (this.isRunning) return;

        this.isRunning = true;
        
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        
        source.connect(this.analyser);
        
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        this.timeDomainArray = new Uint8Array(bufferLength);
        
        const analyze = () => {
            if (!this.isRunning) return;
            
            // 获取频域数据用于特征提取
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // 获取时域数据用于波形显示
            this.analyser.getByteTimeDomainData(this.timeDomainArray);
            
            const features = this.extractFeatures(this.dataArray);
            this.featureHistory.push(features);
            
            if (this.featureHistory.length > 300) {
                this.featureHistory = this.featureHistory.slice(-150);
            }
            
            if (callback) callback(features);
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }

    extractFeatures(frequencyData) {
        const features = {
            timestamp: Date.now(),
            fundamentalFrequency: this.estimateFundamentalFrequency(frequencyData),
            spectralCentroid: this.calculateSpectralCentroid(frequencyData),
            spectralRolloff: this.calculateSpectralRolloff(frequencyData),
            zeroCrossingRate: this.estimateZeroCrossingRate(frequencyData),
            rmsEnergy: this.calculateRMSEnergy(frequencyData),
            spectralFlux: 0,
            mfccs: this.mockMFCCs()
        };

        // Mock voice emotion features
        const emotionFeatures = this.estimateVoiceEmotion(features);
        features.emotion = emotionFeatures;

        if (window.adCareApp && window.adCareApp.dataLogger) {
            window.adCareApp.dataLogger.logEvent('audio_features', {
                fundamentalFrequency: features.fundamentalFrequency,
                spectralCentroid: features.spectralCentroid,
                rmsEnergy: features.rmsEnergy,
                emotion: emotionFeatures.dominant
            });
        }

        return features;
    }

    estimateFundamentalFrequency(frequencyData) {
        // Mock fundamental frequency estimation
        return 120 + Math.random() * 150;
    }

    calculateSpectralCentroid(frequencyData) {
        let sum = 0;
        let weightedSum = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const magnitude = frequencyData[i];
            const frequency = i * this.audioContext.sampleRate / (2 * frequencyData.length);
            sum += magnitude;
            weightedSum += magnitude * frequency;
        }
        
        return sum > 0 ? weightedSum / sum : 0;
    }

    calculateSpectralRolloff(frequencyData) {
        const totalEnergy = frequencyData.reduce((a, b) => a + b, 0);
        const threshold = totalEnergy * 0.85;
        
        let cumulativeEnergy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            cumulativeEnergy += frequencyData[i];
            if (cumulativeEnergy >= threshold) {
                return i * this.audioContext.sampleRate / (2 * frequencyData.length);
            }
        }
        
        return 0;
    }

    estimateZeroCrossingRate(frequencyData) {
        let crossings = 0;
        for (let i = 1; i < frequencyData.length; i++) {
            if ((frequencyData[i] >= 128 && frequencyData[i - 1] < 128) ||
                (frequencyData[i] < 128 && frequencyData[i - 1] >= 128)) {
                crossings++;
            }
        }
        return crossings / frequencyData.length;
    }

    calculateRMSEnergy(frequencyData) {
        const sum = frequencyData.reduce((acc, val) => acc + val * val, 0);
        return Math.sqrt(sum / frequencyData.length);
    }

    mockMFCCs() {
        // Return mock MFCC coefficients
        return Array.from({ length: 13 }, () => -20 + Math.random() * 40);
    }

    estimateVoiceEmotion(features) {
        // Mock voice emotion estimation based on acoustic features
        const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful'];
        const baseEnergy = features.rmsEnergy / 128;
        
        let dominant = 'neutral';
        let maxProb = 0.4;
        
        const probs = {};
        
        emotions.forEach(emotion => {
            let prob;
            switch(emotion) {
                case 'neutral':
                    prob = 0.3 + (1 - baseEnergy) * 0.2;
                    break;
                case 'happy':
                    prob = baseEnergy * 0.3 + (features.fundamentalFrequency > 180 ? 0.2 : 0);
                    break;
                case 'sad':
                    prob = (1 - baseEnergy) * 0.2 + (features.fundamentalFrequency < 150 ? 0.15 : 0);
                    break;
                case 'angry':
                    prob = baseEnergy * 0.25 + (features.spectralCentroid > 2000 ? 0.15 : 0);
                    break;
                case 'fearful':
                    prob = features.zeroCrossingRate * 0.2;
                    break;
                default:
                    prob = 0.1;
            }
            
            probs[emotion] = prob;
            if (prob > maxProb) {
                maxProb = prob;
                dominant = emotion;
            }
        });
        
        return {
            dominant: dominant,
            confidence: maxProb,
            probabilities: probs
        };
    }

    drawWaveform(canvas, audioData) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        
        // 考虑高清屏的缩放
        ctx.scale(dpr, dpr);
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制中心线
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // 绘制波形
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        
        const sliceWidth = width / audioData.length;
        let x = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            // 时域数据范围是 0-255，中心点是 128
            const v = (audioData[i] - 128) / 128.0;
            const y = (v * height) / 2 + height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        
        // 重置变换矩阵
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    stopAnalysis() {
        this.isRunning = false;
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    getFeatureHistory() {
        return this.featureHistory;
    }

    getLatestFeatures() {
        return this.featureHistory[this.featureHistory.length - 1] || null;
    }
}
