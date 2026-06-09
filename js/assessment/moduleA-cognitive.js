class ModuleACognitive {
    constructor(app) {
        this.app = app;
        this.currentTask = null;
        this.taskData = {
            memory: { attempts: [], score: 0 },
            executive: { attempts: [], score: 0 },
            language: { attempts: [], score: 0 },
            spatial: { attempts: [], score: 0 }
        };
    }

    renderTask(taskType, container) {
        this.currentTask = taskType;
        container.innerHTML = '';
        
        switch(taskType) {
            case 'memory':
                this.renderMemoryTask(container);
                break;
            case 'executive':
                this.renderExecutiveTask(container);
                break;
            case 'language':
                this.renderLanguageTask(container);
                break;
            case 'spatial':
                this.renderSpatialTask(container);
                break;
        }
    }

    renderMemoryTask(container) {
        const header = UIComponents.createTaskHeader(
            '短时记忆测试',
            '观察数字序列，然后按照正确的顺序点击数字'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '屏幕上将显示一组数字，请记住它们的顺序。数字消失后，按照相同的顺序点击数字按钮。'
        );
        container.appendChild(instruction);
        
        const startBtn = document.createElement('button');
        startBtn.className = 'start-task-btn';
        startBtn.textContent = '开始测试';
        startBtn.addEventListener('click', () => this.startMemoryTest(container));
        container.appendChild(startBtn);
    }

    startMemoryTest(container) {
        const generateRandomSequence = (length) => {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const sequence = [];
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * nums.length);
                sequence.push(nums.splice(randomIndex, 1)[0]);
            }
            return sequence;
        };
        
        const sequences = [
            generateRandomSequence(4),
            generateRandomSequence(5),
            generateRandomSequence(6),
            generateRandomSequence(7)
        ];
        
        let currentLevel = 0;
        let userSequence = [];
        let isShowingSequence = false;
        
        const runLevel = () => {
            if (currentLevel >= sequences.length) {
                this.showMemoryResults(container);
                return;
            }
            
            container.innerHTML = '';
            const sequence = sequences[currentLevel];
            
            const progress = UIComponents.createProgressBar(currentLevel, sequences.length);
            container.appendChild(progress);
            
            const levelText = document.createElement('p');
            levelText.textContent = `第 ${currentLevel + 1} 关 - 记住 ${sequence.length} 个数字`;
            levelText.style.textAlign = 'center';
            levelText.style.margin = '1rem 0';
            container.appendChild(levelText);
            
            const displayArea = document.createElement('div');
            displayArea.className = 'sequence-display';
            container.appendChild(displayArea);
            
            const inputArea = document.createElement('div');
            inputArea.className = 'sequence-input';
            inputArea.style.display = 'none';
            container.appendChild(inputArea);
            
            // Show sequence
            isShowingSequence = true;
            let index = 0;
            
            const showNext = () => {
                if (index < sequence.length) {
                    displayArea.innerHTML = '';
                    const num = document.createElement('div');
                    num.className = 'sequence-number';
                    num.textContent = sequence[index];
                    displayArea.appendChild(num);
                    index++;
                    setTimeout(showNext, 1000);
                } else {
                    // Show input
                    displayArea.innerHTML = '<p style="color: #64748b;">请按顺序点击数字</p>';
                    inputArea.style.display = 'flex';
                    isShowingSequence = false;
                    userSequence = [];
                    
                    // Create number buttons
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    nums.forEach(n => {
                        const btn = document.createElement('button');
                        btn.className = 'num-btn';
                        btn.textContent = n;
                        btn.addEventListener('click', () => {
                            userSequence.push(n);
                            
                            // Visual feedback
                            btn.style.background = '#dbeafe';
                            setTimeout(() => {
                                btn.style.background = '';
                            }, 200);
                            
                            if (userSequence.length === sequence.length) {
                                const correct = userSequence.every((val, i) => val === sequence[i]);
                                
                                this.taskData.memory.attempts.push({
                                    level: currentLevel,
                                    sequence: sequence,
                                    userSequence: userSequence,
                                    correct: correct,
                                    timestamp: Date.now()
                                });
                                
                                if (correct) {
                                    this.taskData.memory.score++;
                                    UIComponents.showToast('正确！', 'success');
                                } else {
                                    UIComponents.showToast('顺序有误', 'error');
                                }
                                
                                currentLevel++;
                                setTimeout(() => runLevel(), 1500);
                            }
                        });
                        inputArea.appendChild(btn);
                    });
                }
            };
            
            showNext();
        };
        
        runLevel();
    }

    showMemoryResults(container) {
        container.innerHTML = '';
        const correct = this.taskData.memory.score;
        const total = this.taskData.memory.attempts.length;
        
        const result = UIComponents.createResultCard(
            `${correct}/${total}`,
            '记忆测试完成',
            correct >= 3 ? '表现优秀！' : correct >= 2 ? '表现良好' : '建议加强记忆训练'
        );
        container.appendChild(result);
        
        this.app.markTaskCompleted('A', 'memory');
        
        this.app.dataLogger.logEvent('task_completed', {
            task: 'memory',
            score: correct,
            total: total,
            attempts: this.taskData.memory.attempts
        });
        
        // 自动跳转到执行功能测试
        setTimeout(() => {
            this.app.switchTask('A', 'executive');
        }, 2000);
    }

    renderExecutiveTask(container) {
        const header = UIComponents.createTaskHeader(
            'Stroop色词测试',
            '选择文字所显示的颜色，而不是文字本身的含义'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '例如：文字显示"红色"但颜色是蓝色，请点击"蓝色"。'
        );
        container.appendChild(instruction);
        
        const startBtn = document.createElement('button');
        startBtn.className = 'start-task-btn';
        startBtn.textContent = '开始测试';
        startBtn.addEventListener('click', () => this.startStroopTest(container));
        container.appendChild(startBtn);
    }

    startStroopTest(container) {
        const trials = [
            { word: '红色', color: 'blue', correct: '蓝色' },
            { word: '绿色', color: 'red', correct: '红色' },
            { word: '蓝色', color: 'green', correct: '绿色' },
            { word: '黄色', color: 'red', correct: '红色' },
            { word: '红色', color: 'green', correct: '绿色' },
            { word: '蓝色', color: 'yellow', correct: '黄色' }
        ];
        
        const colors = [
            { name: '红色', value: 'red', hex: '#ef4444' },
            { name: '绿色', value: 'green', hex: '#22c55e' },
            { name: '蓝色', value: 'blue', hex: '#2563eb' },
            { name: '黄色', value: 'yellow', hex: '#eab308' }
        ];
        
        let currentTrial = 0;
        let correctCount = 0;
        let startTime = 0;
        
        const runTrial = () => {
            if (currentTrial >= trials.length) {
                this.showStroopResults(container, correctCount, trials.length);
                return;
            }
            
            container.innerHTML = '';
            const trial = trials[currentTrial];
            startTime = Date.now();
            
            const progress = UIComponents.createProgressBar(currentTrial, trials.length);
            container.appendChild(progress);
            
            const wordDisplay = document.createElement('div');
            wordDisplay.className = 'stroop-word';
            wordDisplay.textContent = trial.word;
            wordDisplay.style.color = trial.color === 'red' ? '#ef4444' : 
                                     trial.color === 'green' ? '#22c55e' :
                                     trial.color === 'blue' ? '#2563eb' : '#eab308';
            container.appendChild(wordDisplay);
            
            const options = document.createElement('div');
            options.className = 'stroop-options';
            
            colors.forEach(color => {
                const btn = document.createElement('button');
                btn.className = 'stroop-btn';
                btn.textContent = color.name;
                btn.style.borderColor = color.hex;
                btn.style.color = color.hex;
                
                btn.addEventListener('click', () => {
                    const reactionTime = Date.now() - startTime;
                    const isCorrect = color.name === trial.correct;
                    
                    if (isCorrect) {
                        correctCount++;
                        btn.style.background = '#f0fdf4';
                    } else {
                        btn.style.background = '#fef2f2';
                    }
                    
                    this.taskData.executive.attempts.push({
                        trial: currentTrial,
                        word: trial.word,
                        displayColor: trial.color,
                        selected: color.name,
                        correct: isCorrect,
                        reactionTime: reactionTime
                    });
                    
                    currentTrial++;
                    setTimeout(() => runTrial(), 800);
                });
                
                options.appendChild(btn);
            });
            
            container.appendChild(options);
        };
        
        runTrial();
    }

    showStroopResults(container, correct, total) {
        container.innerHTML = '';
        
        const avgReactionTime = this.taskData.executive.attempts.reduce((a, b) => a + b.reactionTime, 0) / total;
        
        const result = UIComponents.createResultCard(
            `${correct}/${total}`,
            '执行功能测试完成',
            `平均反应时间: ${Math.round(avgReactionTime)}ms`
        );
        container.appendChild(result);
        
        this.app.markTaskCompleted('A', 'executive');
        this.app.dataLogger.logEvent('task_completed', {
            task: 'executive',
            score: correct,
            total: total,
            avgReactionTime: avgReactionTime
        });
        
        // 自动跳转到语言测试
        setTimeout(() => {
            this.app.switchTask('A', 'language');
        }, 2000);
    }

    renderLanguageTask(container) {
        const header = UIComponents.createTaskHeader(
            '词语流畅性测试',
            '在60秒内说出尽可能多的动物名称'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '点击"开始"后，您将有60秒的时间。请说出尽可能多的不同动物名称，每个动物只需说一次。'
        );
        container.appendChild(instruction);
        
        const startBtn = document.createElement('button');
        startBtn.className = 'start-task-btn';
        startBtn.textContent = '开始测试';
        startBtn.addEventListener('click', () => this.startFluencyTest(container));
        container.appendChild(startBtn);
    }

    startFluencyTest(container) {
        container.innerHTML = '';
        
        const timer = UIComponents.createTimer(60, () => {
            this.showFluencyResults(container, words.length);
        });
        container.appendChild(timer);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'naming-input';
        input.placeholder = '输入动物名称后按回车';
        container.appendChild(input);
        
        const wordList = document.createElement('div');
        wordList.style.display = 'flex';
        wordList.style.flexWrap = 'wrap';
        wordList.style.gap = '0.5rem';
        wordList.style.marginTop = '1rem';
        container.appendChild(wordList);
        
        const words = [];
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                const word = input.value.trim();
                
                if (!words.includes(word)) {
                    words.push(word);
                    
                    const tag = document.createElement('span');
                    tag.style.cssText = `
                        background: #dbeafe;
                        color: #1e40af;
                        padding: 0.375rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.875rem;
                    `;
                    tag.textContent = word;
                    wordList.appendChild(tag);
                    
                    this.app.dataLogger.logEvent('word_spoken', {
                        word: word,
                        index: words.length,
                        timestamp: Date.now()
                    });
                }
                
                input.value = '';
            }
        });
        
        input.focus();
    }

    showFluencyResults(container, count) {
        container.innerHTML = `
            <div class="mini-result">
                <div class="score">${count}</div>
                <div class="score-label">语言流畅性得分</div>
                <p>您在60秒内说出了${count}个词语</p>
                <p style="margin-top: 1rem; color: #666;">即将自动跳转到下一项测试...</p>
            </div>
        `;
        this.app.markTaskCompleted('A', 'language');
        this.app.dataLogger.logEvent('task_completed', {
            task: 'language',
            score: count
        });
        
        // 自动跳转到视空间测试
        setTimeout(() => {
            this.app.switchTask('A', 'spatial');
        }, 2000);
    }

    renderSpatialTask(container) {
        const header = UIComponents.createTaskHeader(
            '时钟绘制测试',
            '在钟面上画出指定的时间'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '请在空白钟面上画出"10点15分"，包括所有数字和指针。'
        );
        container.appendChild(instruction);
        
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'clock-canvas-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'clock-canvas';
        canvas.width = 300;
        canvas.height = 300;
        canvasContainer.appendChild(canvas);
        
        const renderer = new CanvasRenderer(canvas);
        renderer.drawClockFace(150, 150, 120);
        
        const controls = document.createElement('div');
        controls.className = 'clock-controls';
        
        const clearBtn = UIComponents.createButton('清空', () => {
            renderer.drawClockFace(150, 150, 120);
        }, 'secondary');
        
        const finishBtn = UIComponents.createButton('完成', () => {
            const imageData = renderer.getImageData();
            this.taskData.spatial.attempts.push({
                imageData: imageData,
                timestamp: Date.now()
            });
            
            this.showSpatialResults(container);
        }, 'primary');
        
        controls.appendChild(clearBtn);
        controls.appendChild(finishBtn);
        canvasContainer.appendChild(controls);
        
        container.appendChild(canvasContainer);
        
        // Setup drawing
        const cleanup = renderer.setupDrawing({
            color: '#2563eb',
            lineWidth: 3,
            onStart: () => {
                this.app.dataLogger.logEvent('drawing_started', {
                    task: 'clock_drawing'
                });
            },
            onEnd: () => {
                this.app.dataLogger.logEvent('drawing_ended', {
                    task: 'clock_drawing'
                });
            }
        });
        
        // Store cleanup function
        this.clockCleanup = cleanup;
    }

    showSpatialResults(container) {
        if (this.clockCleanup) {
            this.clockCleanup();
        }
        
        container.innerHTML = '';
        
        const result = UIComponents.createResultCard(
            '完成',
            '视空间测试完成',
            '绘图已保存，将由专业人员进行分析'
        );
        container.appendChild(result);
        
        this.app.markTaskCompleted('A', 'spatial');
        this.app.dataLogger.logEvent('task_completed', {
            task: 'spatial',
            attempts: this.taskData.spatial.attempts.length
        });
        
        // 自动跳转到日常功能测试
        setTimeout(() => {
            this.app.switchModule('C');
            this.app.switchTask('C', 'medication');
        }, 2000);
    }
}
