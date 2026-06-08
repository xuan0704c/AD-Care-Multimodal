class ModuleCDaily {
    constructor(app) {
        this.app = app;
        this.currentTask = null;
        this.taskData = {
            medication: { responses: [], score: 0 },
            appointment: { responses: [], score: 0 },
            finance: { responses: [], score: 0 },
            route: { responses: [], score: 0 },
            social: { responses: [], score: 0 }
        };
    }

    renderTask(taskType, container) {
        this.currentTask = taskType;
        container.innerHTML = '';
        
        switch(taskType) {
            case 'medication':
                this.renderMedicationTask(container);
                break;
            case 'appointment':
                this.renderAppointmentTask(container);
                break;
            case 'finance':
                this.renderFinanceTask(container);
                break;
            case 'route':
                this.renderRouteTask(container);
                break;
            case 'social':
                this.renderSocialTask(container);
                break;
        }
    }

    renderMedicationTask(container) {
        const header = UIComponents.createTaskHeader(
            '药物识别任务',
            '请选择正确的药物类别'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '观察以下药物，选择它所属的类别。'
        );
        container.appendChild(instruction);
        
        const medications = [
            { icon: '💊', name: '阿司匹林', category: '止痛药', options: ['止痛药', '抗生素', '维生素'] },
            { icon: '💉', name: '胰岛素', category: '降糖药', options: ['降压药', '降糖药', '抗过敏药'] },
            { icon: '🩺', name: '阿莫西林', category: '抗生素', options: ['抗生素', '退烧药', '消化药'] }
        ];
        
        let currentIndex = 0;
        let correctCount = 0;
        
        const showMedication = () => {
            if (currentIndex >= medications.length) {
                this.showDailyResults(container, 'medication', correctCount, medications.length);
                return;
            }
            
            const med = medications[currentIndex];
            
            const card = document.createElement('div');
            card.className = 'daily-task-card';
            card.innerHTML = `
                <div style="text-align: center; font-size: 4rem; margin: 1rem 0;">${med.icon}</div>
                <h4 style="text-align: center;">${med.name}</h4>
                <p style="text-align: center; color: #64748b;">这是什么类型的药物？</p>
            `;
            
            const options = UIComponents.createOptionList(
                med.options.map(opt => ({ value: opt, label: opt })),
                (value) => {
                    const isCorrect = value === med.category;
                    if (isCorrect) correctCount++;
                    
                    this.taskData.medication.responses.push({
                        medication: med.name,
                        selected: value,
                        correct: isCorrect,
                        timestamp: Date.now()
                    });
                    
                    currentIndex++;
                    setTimeout(() => showMedication(), 800);
                }
            );
            
            container.innerHTML = '';
            container.appendChild(header);
            container.appendChild(card);
            container.appendChild(options);
        };
        
        showMedication();
    }

    renderAppointmentTask(container) {
        const header = UIComponents.createTaskHeader(
            '线上预约任务',
            '模拟医院预约挂号'
        );
        container.appendChild(header);
        
        const scenarios = [
            {
                question: '您需要预约神经内科专家号，应该选择哪个科室？',
                options: [
                    { value: 'neuro', label: '神经内科', correct: true },
                    { value: 'cardio', label: '心内科', correct: false },
                    { value: 'gastro', label: '消化内科', correct: false }
                ]
            },
            {
                question: '预约成功后，您应该提前多久到达医院？',
                options: [
                    { value: '5min', label: '5分钟', correct: false },
                    { value: '15min', label: '15分钟', correct: true },
                    { value: '1hour', label: '1小时', correct: false }
                ]
            }
        ];
        
        this.runScenario(container, 'appointment', scenarios);
    }

    renderFinanceTask(container) {
        const header = UIComponents.createTaskHeader(
            '财务计算任务',
            '模拟购物找零计算'
        );
        container.appendChild(header);
        
        const instruction = UIComponents.createInstructionBox(
            '请计算以下购物场景的找零金额。'
        );
        container.appendChild(instruction);
        
        const problems = [
            { item: '牛奶', price: 6.50, paid: 10.00 },
            { item: '面包', price: 8.80, paid: 20.00 },
            { item: '水果', price: 15.30, paid: 50.00 }
        ];
        
        let currentIndex = 0;
        let correctCount = 0;
        
        const showProblem = () => {
            if (currentIndex >= problems.length) {
                this.showDailyResults(container, 'finance', correctCount, problems.length);
                return;
            }
            
            const prob = problems[currentIndex];
            const correctChange = (prob.paid - prob.price).toFixed(2);
            
            container.innerHTML = '';
            container.appendChild(header);
            
            const card = document.createElement('div');
            card.className = 'daily-task-card';
            card.innerHTML = `
                <h4>购买${prob.item}</h4>
                <p>价格: ¥${prob.price.toFixed(2)}</p>
                <p>支付: ¥${prob.paid.toFixed(2)}</p>
                <p style="margin-top: 0.5rem; font-weight: 600;">应找零多少？</p>
            `;
            container.appendChild(card);
            
            const answers = [
                correctChange,
                (parseFloat(correctChange) + 1).toFixed(2),
                (parseFloat(correctChange) - 1).toFixed(2),
                (parseFloat(correctChange) * 2).toFixed(2)
            ].sort(() => Math.random() - 0.5);
            
            const options = UIComponents.createOptionList(
                answers.map(a => ({ value: a, label: `¥${a}` })),
                (value) => {
                    const isCorrect = value === correctChange;
                    if (isCorrect) correctCount++;
                    
                    this.taskData.finance.responses.push({
                        problem: prob,
                        selected: value,
                        correct: isCorrect,
                        timestamp: Date.now()
                    });
                    
                    currentIndex++;
                    setTimeout(() => showProblem(), 800);
                }
            );
            container.appendChild(options);
        };
        
        showProblem();
    }

    renderRouteTask(container) {
        const header = UIComponents.createTaskHeader(
            '路线规划任务',
            '选择合理的出行路线'
        );
        container.appendChild(header);
        
        const scenarios = [
            {
                question: '您需要从家到医院，以下哪条路线最合理？',
                options: [
                    { value: 'direct', label: '直接步行15分钟', correct: true },
                    { value: 'bus', label: '坐公交绕路1小时', correct: false },
                    { value: 'taxi', label: '打车绕远路', correct: false }
                ]
            },
            {
                question: '如果要最节省时间的路线，您会选择？',
                options: [
                    { value: 'shortcut', label: '抄近路小路', correct: false },
                    { value: 'main', label: '主干道直行', correct: true },
                    { value: 'random', label: '随便走走', correct: false }
                ]
            }
        ];
        
        this.runScenario(container, 'route', scenarios);
    }

    renderSocialTask(container) {
        const header = UIComponents.createTaskHeader(
            '社交互动任务',
            '选择合适的社交回应'
        );
        container.appendChild(header);
        
        const scenarios = [
            {
                question: '朋友告诉您他生病了，您应该：',
                options: [
                    { value: 'care', label: '表示关心并询问病情', correct: true },
                    { value: 'ignore', label: '转移话题', correct: false },
                    { value: 'joke', label: '开玩笑', correct: false }
                ]
            },
            {
                question: '有人向您问路，但您也不清楚，您应该：',
                options: [
                    { value: 'guess', label: '随便指个方向', correct: false },
                    { value: 'help', label: '建议他询问其他人或查看地图', correct: true },
                    { value: 'refuse', label: '直接拒绝', correct: false }
                ]
            }
        ];
        
        this.runScenario(container, 'social', scenarios);
    }

    runScenario(container, taskType, scenarios) {
        let currentIndex = 0;
        let correctCount = 0;
        
        const showScenario = () => {
            if (currentIndex >= scenarios.length) {
                this.showDailyResults(container, taskType, correctCount, scenarios.length);
                return;
            }
            
            const scenario = scenarios[currentIndex];
            
            container.innerHTML = '';
            
            const card = document.createElement('div');
            card.className = 'daily-task-card';
            card.innerHTML = `
                <h4>场景 ${currentIndex + 1}/${scenarios.length}</h4>
                <p>${scenario.question}</p>
            `;
            
            const options = UIComponents.createOptionList(
                scenario.options.map(opt => ({ value: opt.value, label: opt.label })),
                (value) => {
                    const option = scenario.options.find(o => o.value === value);
                    const isCorrect = option.correct;
                    if (isCorrect) correctCount++;
                    
                    this.taskData[taskType].responses.push({
                        scenario: scenario.question,
                        selected: value,
                        correct: isCorrect,
                        timestamp: Date.now()
                    });
                    
                    currentIndex++;
                    setTimeout(() => showScenario(), 800);
                }
            );
            
            container.appendChild(card);
            container.appendChild(options);
        };
        
        showScenario();
    }

    showDailyResults(container, taskType, correct, total) {
        const score = Math.round((correct / total) * 100);
        const taskNames = {
            medication: '药物识别',
            appointment: '线上预约',
            finance: '财务计算',
            route: '路线规划',
            social: '社交互动'
        };
        
        container.innerHTML = `
            <div class="mini-result">
                <div class="score">${score}</div>
                <div class="score-label">${taskNames[taskType]}得分</div>
                <p>正确率: ${correct}/${total}</p>
            </div>
        `;
        
        // Add navigation buttons based on task
        const nav = document.createElement('div');
        nav.className = 'task-nav';
        
        if (taskType === 'medication') {
            nav.innerHTML = '<button class="start-task-btn" onclick="adCareApp.switchTask(\'C\', \'appointment\')">下一个任务</button>';
        } else if (taskType === 'appointment') {
            nav.innerHTML = '<button class="start-task-btn" onclick="adCareApp.switchTask(\'C\', \'finance\')">下一个任务</button>';
        } else if (taskType === 'finance') {
            nav.innerHTML = '<button class="start-task-btn" onclick="adCareApp.switchTask(\'C\', \'route\')">下一个任务</button>';
        } else if (taskType === 'route') {
            nav.innerHTML = '<button class="start-task-btn" onclick="adCareApp.switchTask(\'C\', \'social\')">下一个任务</button>';
        } else if (taskType === 'social') {
            nav.innerHTML = '<button class="start-task-btn" onclick="adCareApp.confirmExit()">完成所有评估</button>';
        }
        
        container.appendChild(nav);
        this.app.markTaskCompleted('C', taskType);
        this.app.dataLogger.logEvent('task_completed', {
            task: taskType,
            score: correct,
            total: total,
            responses: this.taskData[taskType].responses
        });
    }
}
