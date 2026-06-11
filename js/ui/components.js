class UIComponents {
    static createTaskHeader(title, description) {
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 class="task-title">${title}</h3>
            <p class="task-description">${description}</p>
        `;
        return header;
    }

    static createTimer(durationSeconds, onComplete) {
        const timer = document.createElement('div');
        timer.className = 'task-timer';
        
        let remaining = durationSeconds;
        
        const update = () => {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timer.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (remaining <= 10) {
                timer.style.background = '#fee2e2';
                timer.style.color = '#991b1b';
            }
        };
        
        update();
        
        const interval = setInterval(() => {
            remaining--;
            update();
            
            if (remaining <= 0) {
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, 1000);
        
        timer.dataset.interval = interval;
        return timer;
    }

    static createProgressBar(current, total) {
        const progress = document.createElement('div');
        progress.className = 'progress-bar';
        progress.innerHTML = `
            <div class="progress-fill" style="width: ${(current / total) * 100}%"></div>
        `;
        return progress;
    }

    static createInstructionBox(text) {
        const box = document.createElement('div');
        box.className = 'instruction-box';
        box.innerHTML = `<p>${text}</p>`;
        return box;
    }

    static createButton(text, onClick, variant = 'primary') {
        const btn = document.createElement('button');
        btn.className = `btn btn-${variant}`;
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }

    static createNavigationButtons(onPrev, onNext, showPrev = true) {
        const nav = document.createElement('div');
        nav.className = 'task-nav';
        
        if (showPrev) {
            nav.appendChild(this.createButton('← 上一步', onPrev, 'secondary'));
        } else {
            nav.appendChild(document.createElement('div'));
        }
        
        nav.appendChild(this.createButton('下一步 →', onNext, 'primary'));
        return nav;
    }

    static createResultCard(score, label, feedback) {
        const card = document.createElement('div');
        card.className = 'mini-result';
        card.innerHTML = `
            <div class="score">${score}</div>
            <div class="score-label">${label}</div>
            <p>${feedback}</p>
        `;
        return card;
    }

    static createOptionList(options, onSelect, name = 'option') {
        const list = document.createElement('div');
        list.className = 'option-list';
        
        options.forEach((option, index) => {
            const item = document.createElement('label');
            item.className = 'option-item';
            item.innerHTML = `
                <input type="radio" name="${name}" value="${option.value}">
                <span>${option.label}</span>
            `;
            
            item.addEventListener('click', () => {
                list.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                if (onSelect) onSelect(option.value, index);
            });
            
            list.appendChild(item);
        });
        
        return list;
    }

    static createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        const actionsHtml = actions.map(action => 
            `<button class="btn btn-${action.variant || 'primary'}" data-action="${action.id}">${action.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${content}</p>
                <div class="modal-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        actions.forEach(action => {
            const btn = modal.querySelector(`[data-action="${action.id}"]`);
            if (btn && action.onClick) {
                btn.addEventListener('click', () => {
                    action.onClick();
                    modal.remove();
                });
            }
        });
        
        return modal;
    }

    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.875rem;
            z-index: 10000;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static createCountdown(seconds, onComplete) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            flex-direction: column;
        `;
        
        const number = document.createElement('div');
        number.style.cssText = `
            font-size: 6rem;
            font-weight: 700;
            color: white;
            animation: scaleIn 0.5s ease;
        `;
        
        const label = document.createElement('div');
        label.style.cssText = `
            font-size: 1.25rem;
            color: rgba(255,255,255,0.8);
            margin-top: 1rem;
        `;
        label.textContent = '准备开始...';
        
        container.appendChild(number);
        container.appendChild(label);
        document.body.appendChild(container);
        
        let count = seconds;
        
        const update = () => {
            number.textContent = count;
            number.style.animation = 'none';
            number.offsetHeight; // Trigger reflow
            number.style.animation = 'scaleIn 0.5s ease';
            
            if (count <= 0) {
                container.remove();
                if (onComplete) onComplete();
                return;
            }
            
            count--;
            setTimeout(update, 1000);
        };
        
        update();
    }
}

// Add keyframe animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOutDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
    @keyframes scaleIn {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);
