/**
 * 模拟API接口，用于生成随机的评估数据
 * 后续对接真实模型时，只需替换这些函数的实现即可
 */

// 报告缓存的localStorage键名前缀
const REPORT_CACHE_PREFIX = 'adcare_report_cache_';

// 将报告数据保存到本地缓存
function saveReportToCache(sessionId, reportData) {
    if (!sessionId) return;
    const cacheKey = REPORT_CACHE_PREFIX + sessionId;
    localStorage.setItem(cacheKey, JSON.stringify(reportData));
}

// 从本地缓存中获取报告数据
function getReportFromCache(sessionId) {
    if (!sessionId) return null;
    const cacheKey = REPORT_CACHE_PREFIX + sessionId;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            console.warn('解析缓存报告数据失败:', e);
            return null;
        }
    }
    return null;
}

// 随机生成综合评分（60-95分）
function generateRandomScore() {
    return Math.floor(Math.random() * 36) + 60; // 60-95
}

// 生成语言与认知维度的详细数据
function generateLanguageCognitionData(score) {
    // 根据综合评分生成对应的维度数据
    let level, percentage, description;
    
    if (score >= 85) {
        level = '正常';
        percentage = Math.floor(Math.random() * 15) + 85; // 85-100%
        description = ['语言表达流畅，语义理解准确，逻辑思维清晰。', '语言认知功能良好，词汇丰富度和语句组织能力表现优秀。', '语言交流能力正常，能够准确表达和理解复杂概念。'][Math.floor(Math.random() * 3)];
    } else if (score >= 75) {
        level = '轻度波动';
        percentage = Math.floor(Math.random() * 10) + 75; // 75-84%
        description = ['部分语句表达略显迟缓，偶尔出现词汇检索困难。', '语言理解基本正常，但在复杂指令下需要重复确认。', '语言流畅度略有下降，建议增加日常语言训练。'][Math.floor(Math.random() * 3)];
    } else if (score >= 65) {
        level = '中度异常';
        percentage = Math.floor(Math.random() * 10) + 65; // 65-74%
        description = ['语言表达存在明显困难，经常出现用词错误或语句中断。', '语义理解能力下降，对复杂信息的处理存在障碍。', '语言组织能力减弱，建议进行专业的语言康复训练。'][Math.floor(Math.random() * 3)];
    } else {
        level = '重度异常';
        percentage = Math.floor(Math.random() * 5) + 60; // 60-64%
        description = ['语言功能严重受损，难以进行有效的沟通交流。', '语言理解和表达能力均存在显著障碍，需要专人协助沟通。', '语言认知功能重度异常，建议立即进行临床干预。'][Math.floor(Math.random() * 3)];
    }
    
    return {
        level: level,
        percentage: percentage,
        description: description
    };
}

// 生成综合风险评估结果
function generateRiskAssessment(score) {
    if (score >= 85) {
        return {
            level: '低风险',
            grade: 'LEVEL 0',
            color: 'text-green-600',
            bg: 'from-green-50 to-emerald-50',
            border: 'border-green-100',
            bar: 'bg-green-400',
            summary: '本次多模态认知评估综合得分为 <span class="font-bold underline">' + score + '/100</span>。各维度表现良好，建议保持当前生活状态并定期随访。'
        };
    } else if (score >= 75) {
        return {
            level: '轻度风险',
            grade: 'LEVEL 1',
            color: 'text-yellow-600',
            bg: 'from-yellow-50 to-orange-50',
            border: 'border-yellow-100',
            bar: 'bg-yellow-400',
            summary: '本次多模态认知评估综合得分为 <span class="font-bold underline">' + score + '/100</span>。部分维度存在轻度波动，建议适当增加认知训练并关注生活方式。'
        };
    } else if (score >= 65) {
        return {
            level: '中度风险',
            grade: 'LEVEL 2',
            color: 'text-orange-600',
            bg: 'from-orange-50 to-red-50',
            border: 'border-orange-100',
            bar: 'bg-orange-400',
            summary: '本次多模态认知评估综合得分为 <span class="font-bold underline">' + score + '/100</span>。在语言与认知维度表现出明显异常倾向，建议在3个月内进行临床神经心理学复核。'
        };
    } else {
        return {
            level: '高风险',
            grade: 'LEVEL 3',
            color: 'text-red-600',
            bg: 'from-red-50 to-rose-50',
            border: 'border-red-100',
            bar: 'bg-red-400',
            summary: '本次多模态认知评估综合得分为 <span class="font-bold underline">' + score + '/100</span>。多维度评估结果异常，建议尽快预约三甲医院记忆门诊进行详细检查。'
        };
    }
}

// 生成临床干预建议
function generateInterventionSuggestions(score) {
    if (score >= 85) {
        return [
            '• <strong>定期随访：</strong> 建议每 6 个月进行一次认知评估复测。',
            '• <strong>生活方式：</strong> 保持现有饮食与运动习惯，适当增加社交活动。',
            '• <strong>认知训练：</strong> 可自愿进行每日 15 分钟的阅读或益智游戏。'
        ];
    } else if (score >= 75) {
        return [
            '• <strong>关注变化：</strong> 建议每 3 个月进行一次认知评估复测。',
            '• <strong>家庭训练：</strong> 进行每日 20 分钟的回忆疗法（翻看老照片描述）。',
            '• <strong>生活方式：</strong> 增加地中海饮食比例，每日进行 15 分钟平衡训练。'
        ];
    } else if (score >= 65) {
        return [
            '• <strong>临床转诊：</strong> 建议预约三甲医院记忆门诊进行进一步检查。',
            '• <strong>专业训练：</strong> 在语言治疗师指导下进行每周 3 次的语言认知训练。',
            '• <strong>家庭支持：</strong> 家属需协助患者进行日常语言交流和记忆训练。'
        ];
    } else {
        return [
            '• <strong>紧急转诊：</strong> 建议尽快前往三甲医院神经内科或记忆门诊就诊。',
            '• <strong>专业干预：</strong> 立即开始系统的语言认知康复治疗。',
            '• <strong>家属配合：</strong> 家属需加强日常看护，避免患者单独外出。'
        ];
    }
}

// 生成完整的评估报告数据
function generateMockAssessmentReport() {
    const score = generateRandomScore();
    const risk = generateRiskAssessment(score);
    const languageCognition = generateLanguageCognitionData(score);
    const suggestions = generateInterventionSuggestions(score);
    
    return {
        score: score,
        riskAssessment: risk,
        languageCognition: languageCognition,
        interventionSuggestions: suggestions,
        // 保留原有的session数据结构，确保兼容性
        sessionId: 'MOCK_' + Date.now(),
        startTime: Date.now() - Math.floor(Math.random() * 3600000), // 1小时内的随机时间
        endTime: Date.now()
    };
}

// 模拟异步API调用
// 首次调用时生成随机数据并缓存，后续调用时直接从缓存读取
function fetchAssessmentReport(sessionId) {
    return new Promise((resolve) => {
        // 模拟网络延迟
        setTimeout(() => {
            // 如果有sessionId，先检查本地缓存
            if (sessionId) {
                const cachedReport = getReportFromCache(sessionId);
                if (cachedReport) {
                    console.log('从缓存读取报告数据:', sessionId);
                    resolve(cachedReport);
                    return;
                }
            }
            
            // 缓存不存在，生成新的随机数据
            const report = generateMockAssessmentReport();
            // 如果提供了sessionId，保留原sessionId
            if (sessionId) {
                report.sessionId = sessionId;
                // 保存到本地缓存
                saveReportToCache(sessionId, report);
                console.log('生成新报告并缓存:', sessionId);
            }
            resolve(report);
        }, 500 + Math.random() * 1000); // 500-1500ms延迟
    });
}

// 导出函数供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateRandomScore,
        generateLanguageCognitionData,
        generateRiskAssessment,
        generateMockAssessmentReport,
        fetchAssessmentReport,
        saveReportToCache,
        getReportFromCache
    };
}