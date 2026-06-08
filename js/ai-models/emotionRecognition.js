class EmotionRecognition {
    constructor() {
        this.emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
        this.emotionColors = {
            neutral: '#94a3b8',
            happy: '#f59e0b',
            sad: '#3b82f6',
            angry: '#ef4444',
            fearful: '#8b5cf6',
            disgusted: '#22c55e',
            surprised: '#f97316'
        };
        this.emotionLabels = {
            neutral: '中性',
            happy: '愉悦',
            sad: '悲伤',
            angry: '愤怒',
            fearful: '恐惧',
            disgusted: '厌恶',
            surprised: '惊讶'
        };
        this.currentEmotion = 'neutral';
        this.emotionHistory = [];
        this.isRunning = false;
    }

    async init() {
        console.log('Emotion recognition model initialized (mock)');
        return true;
    }

    startRecognition(videoElement, callback) {
        if (this.isRunning) return;
        this.isRunning = true;

        this.recognitionInterval = setInterval(() => {
            const result = this.recognizeEmotion(videoElement);
            this.currentEmotion = result.dominantEmotion;
            this.emotionHistory.push(result);
            
            if (this.emotionHistory.length > 600) {
                this.emotionHistory = this.emotionHistory.slice(-300);
            }

            if (callback) callback(result);
        }, 200);
    }

    recognizeEmotion(videoElement) {
        // Mock emotion recognition - simulate realistic emotion patterns
        const time = Date.now() / 1000;
        const basePattern = Math.sin(time * 0.5) * 0.3 + 0.5;
        
        const probabilities = {};
        let maxProb = 0;
        let dominant = 'neutral';

        this.emotions.forEach(emotion => {
            let prob;
            if (emotion === 'neutral') {
                prob = 0.4 + Math.random() * 0.3;
            } else if (emotion === 'happy') {
                prob = basePattern * 0.3 + Math.random() * 0.2;
            } else if (emotion === 'sad') {
                prob = (1 - basePattern) * 0.2 + Math.random() * 0.15;
            } else {
                prob = Math.random() * 0.15;
            }
            
            probabilities[emotion] = prob;
            
            if (prob > maxProb) {
                maxProb = prob;
                dominant = emotion;
            }
        });

        // Normalize probabilities
        const sum = Object.values(probabilities).reduce((a, b) => a + b, 0);
        Object.keys(probabilities).forEach(key => {
            probabilities[key] = probabilities[key] / sum;
        });

        const result = {
            dominantEmotion: dominant,
            confidence: maxProb,
            probabilities: probabilities,
            timestamp: Date.now()
        };

        // Log emotion event
        if (window.adCareApp && window.adCareApp.dataLogger) {
            window.adCareApp.dataLogger.logEvent('emotion_recognized', {
                emotion: dominant,
                confidence: maxProb,
                allProbabilities: probabilities
            });
        }

        return result;
    }

    getEmotionColor(emotion) {
        return this.emotionColors[emotion] || '#94a3b8';
    }

    getEmotionLabel(emotion) {
        return this.emotionLabels[emotion] || emotion;
    }

    getEmotionHistory() {
        return this.emotionHistory;
    }

    getEmotionDistribution() {
        const distribution = {};
        this.emotions.forEach(e => distribution[e] = 0);
        
        this.emotionHistory.forEach(entry => {
            distribution[entry.dominantEmotion]++;
        });
        
        const total = this.emotionHistory.length;
        if (total > 0) {
            Object.keys(distribution).forEach(key => {
                distribution[key] = distribution[key] / total;
            });
        }
        
        return distribution;
    }

    stopRecognition() {
        this.isRunning = false;
        if (this.recognitionInterval) {
            clearInterval(this.recognitionInterval);
            this.recognitionInterval = null;
        }
    }

    renderEmotionBars(container) {
        container.innerHTML = '';
        const current = this.recognizeEmotion();
        
        this.emotions.forEach(emotion => {
            const prob = current.probabilities[emotion];
            const color = this.emotionColors[emotion];
            const label = this.emotionLabels[emotion];
            
            const bar = document.createElement('div');
            bar.className = 'emotion-bar';
            bar.innerHTML = `
                <div class="emotion-label">${label}</div>
                <div class="emotion-track">
                    <div class="emotion-fill" style="width: ${prob * 100}%; background: ${color};"></div>
                </div>
                <div class="emotion-value">${(prob * 100).toFixed(1)}%</div>
            `;
            container.appendChild(bar);
        });
    }
}
