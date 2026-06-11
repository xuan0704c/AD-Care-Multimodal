class PreparationLayer {
    constructor() {
        this.checks = {
            camera: { status: 'pending', result: null },
            microphone: { status: 'pending', result: null },
            screen: { status: 'pending', result: null },
            storage: { status: 'pending', result: null }
        };
    }

    async checkAllDevices() {
        const results = await Promise.all([
            this.checkCamera(),
            this.checkMicrophone(),
            this.checkScreen(),
            this.checkStorage()
        ]);

        const allPassed = results.every(r => r.passed);
        const deviceOkBtn = document.getElementById('btn-device-ok');
        if (deviceOkBtn) {
            deviceOkBtn.disabled = !allPassed;
        }

        return allPassed;
    }

    async checkCamera() {
        this.updateCheckItem('camera', 'checking');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            const video = document.getElementById('preview-video');
            if (video) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();
                };
            }
            
            // Don't stop the stream - keep it for later use
            this.checks.camera = { status: 'passed', result: '摄像头正常工作' };
            this.updateCheckItem('camera', 'passed', '摄像头正常工作');
            
            // Store stream for later
            window.previewStream = stream;
            
            return { passed: true, stream };
        } catch (e) {
            this.checks.camera = { status: 'failed', result: e.message };
            this.updateCheckItem('camera', 'failed', '无法访问摄像头');
            return { passed: false, error: e.message };
        }
    }

    async checkMicrophone() {
        this.updateCheckItem('microphone', 'checking');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Test audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            // Check if microphone is picking up sound
            await new Promise(resolve => setTimeout(resolve, 500));
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            // 保留音频流供后续录制复用，避免重复请求权限
            window.previewAudioStream = stream;
            audioContext.close();
            
            this.checks.microphone = { 
                status: 'passed', 
                result: '麦克风正常工作' 
            };
            this.updateCheckItem('microphone', 'passed', '麦克风正常工作');
            
            return { passed: true };
        } catch (e) {
            this.checks.microphone = { status: 'failed', result: e.message };
            this.updateCheckItem('microphone', 'failed', '无法访问麦克风');
            return { passed: false, error: e.message };
        }
    }

    checkScreen() {
        this.updateCheckItem('screen', 'checking');
        
        const width = window.screen.width;
        const height = window.screen.height;
        const minWidth = 320;
        const minHeight = 480;
        
        const passed = width >= minWidth && height >= minHeight;
        
        if (passed) {
            this.checks.screen = { 
                status: 'passed', 
                result: `${width}x${height}` 
            };
            this.updateCheckItem('screen', 'passed', `${width}x${height}`);
        } else {
            this.checks.screen = { 
                status: 'failed', 
                result: '屏幕分辨率过低' 
            };
            this.updateCheckItem('screen', 'failed', '屏幕分辨率过低');
        }
        
        return { passed };
    }

    async checkStorage() {
        this.updateCheckItem('storage', 'checking');
        
        try {
            let available = 'unknown';
            
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 0;
                available = quota - usage;
                
                const minRequired = 100 * 1024 * 1024; // 100MB
                
                if (available < minRequired) {
                    this.checks.storage = { 
                        status: 'failed', 
                        result: '存储空间不足' 
                    };
                    this.updateCheckItem('storage', 'failed', '存储空间不足');
                    return { passed: false };
                }
            }
            
            // Test IndexedDB
            const testDB = indexedDB.open('TestDB');
            await new Promise((resolve, reject) => {
                testDB.onsuccess = resolve;
                testDB.onerror = reject;
            });
            indexedDB.deleteDatabase('TestDB');
            
            this.checks.storage = { 
                status: 'passed', 
                result: '存储空间充足' 
            };
            this.updateCheckItem('storage', 'passed', '存储空间充足');
            
            return { passed: true };
        } catch (e) {
            this.checks.storage = { status: 'failed', result: e.message };
            this.updateCheckItem('storage', 'failed', '存储检测失败');
            return { passed: false, error: e.message };
        }
    }

    updateCheckItem(checkType, status, message = '') {
        const item = document.querySelector(`[data-check="${checkType}"]`);
        if (!item) return;
        
        const statusEl = item.querySelector('.check-status');
        const resultEl = item.querySelector('.check-result');
        
        item.classList.remove('pass', 'fail');
        
        if (status === 'checking') {
            if (statusEl) statusEl.textContent = '检测中...';
        } else if (status === 'passed') {
            item.classList.add('pass');
            if (statusEl) statusEl.textContent = message;
        } else if (status === 'failed') {
            item.classList.add('fail');
            if (statusEl) statusEl.textContent = message;
        }
    }

    resetChecks() {
        Object.keys(this.checks).forEach(key => {
            this.checks[key] = { status: 'pending', result: null };
            this.updateCheckItem(key, 'checking');
        });
        
        const deviceOkBtn = document.getElementById('btn-device-ok');
        if (deviceOkBtn) {
            deviceOkBtn.disabled = true;
        }
        
        // Stop preview stream
        if (window.previewStream) {
            window.previewStream.getTracks().forEach(track => track.stop());
            window.previewStream = null;
        }
        
        // Stop audio preview stream
        if (window.previewAudioStream) {
            window.previewAudioStream.getTracks().forEach(track => track.stop());
            window.previewAudioStream = null;
        }
        
        const video = document.getElementById('preview-video');
        if (video) {
            video.srcObject = null;
        }
    }

    getDeviceStatus() {
        return this.checks;
    }
}
