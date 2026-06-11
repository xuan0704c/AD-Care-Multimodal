class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawCircle(x, y, radius, color, fill = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    drawLine(x1, y1, x2, y2, color, width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    drawText(text, x, y, options = {}) {
        const {
            font = '16px sans-serif',
            color = '#000',
            align = 'center',
            baseline = 'middle'
        } = options;
        
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    drawRect(x, y, width, height, color, fill = false) {
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    drawClockFace(centerX, centerY, radius) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw clock circle
        this.drawCircle(centerX, centerY, radius, '#333', false);
        this.drawCircle(centerX, centerY, 3, '#333', true);
        
        // Draw numbers
        for (let i = 1; i <= 12; i++) {
            const angle = (i - 3) * (Math.PI * 2) / 12;
            const x = centerX + Math.cos(angle) * (radius - 20);
            const y = centerY + Math.sin(angle) * (radius - 20);
            this.drawText(i.toString(), x, y, {
                font: 'bold 16px sans-serif',
                color: '#333'
            });
        }
        
        // Draw tick marks
        for (let i = 0; i < 60; i++) {
            const angle = i * (Math.PI * 2) / 60;
            const isHour = i % 5 === 0;
            const innerR = radius - (isHour ? 15 : 8);
            const outerR = radius - 5;
            
            const x1 = centerX + Math.cos(angle) * innerR;
            const y1 = centerY + Math.sin(angle) * innerR;
            const x2 = centerX + Math.cos(angle) * outerR;
            const y2 = centerY + Math.sin(angle) * outerR;
            
            this.drawLine(x1, y1, x2, y2, '#333', isHour ? 2 : 1);
        }
    }

    getPointerPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    setupDrawing(options = {}) {
        const {
            color = '#2563eb',
            lineWidth = 3,
            onStart = null,
            onMove = null,
            onEnd = null
        } = options;
        
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        const startDrawing = (e) => {
            isDrawing = true;
            const pos = this.getPointerPosition(e);
            lastX = pos.x;
            lastY = pos.y;
            
            if (onStart) onStart(pos);
        };
        
        const draw = (e) => {
            if (!isDrawing) return;
            
            const pos = this.getPointerPosition(e);
            
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
            
            lastX = pos.x;
            lastY = pos.y;
            
            if (onMove) onMove(pos);
        };
        
        const stopDrawing = (e) => {
            if (isDrawing && onEnd) {
                const pos = this.getPointerPosition(e);
                onEnd(pos);
            }
            isDrawing = false;
        };
        
        this.canvas.addEventListener('mousedown', startDrawing);
        this.canvas.addEventListener('mousemove', draw);
        this.canvas.addEventListener('mouseup', stopDrawing);
        this.canvas.addEventListener('mouseout', stopDrawing);
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e);
        }, { passive: false });
        this.canvas.addEventListener('touchend', stopDrawing);
        
        return () => {
            this.canvas.removeEventListener('mousedown', startDrawing);
            this.canvas.removeEventListener('mousemove', draw);
            this.canvas.removeEventListener('mouseup', stopDrawing);
            this.canvas.removeEventListener('mouseout', stopDrawing);
            this.canvas.removeEventListener('touchstart', startDrawing);
            this.canvas.removeEventListener('touchmove', draw);
            this.canvas.removeEventListener('touchend', stopDrawing);
        };
    }

    getImageData() {
        return this.canvas.toDataURL('image/png');
    }

    loadImageData(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
}
