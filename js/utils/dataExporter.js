class DataExporter {
    constructor() {
        this.exportInProgress = false;
    }

    async exportAllData(sessionManager, dataLogger, mediaRecorder) {
        if (this.exportInProgress) {
            alert('导出正在进行中，请稍候...');
            return;
        }

        this.exportInProgress = true;

        try {
            const zip = new JSZip();
            const sessionId = sessionManager.sessionId;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // 1. Metadata
            const metadata = sessionManager.getMetadata();
            metadata.exportTime = Date.now();
            metadata.totalLogs = dataLogger.logs.length;
            metadata.videoSegments = mediaRecorder.videoSegments.length;
            metadata.audioSegments = mediaRecorder.audioSegments.length;
            
            zip.file('metadata.json', JSON.stringify(metadata, null, 2));

            // 2. Interaction logs
            const jsonlContent = dataLogger.exportToJSONL();
            zip.file('interaction_log.jsonl', jsonlContent);

            // 3. Video segments
            const videoFolder = zip.folder('video');
            for (let i = 0; i < mediaRecorder.videoSegments.length; i++) {
                const segment = mediaRecorder.videoSegments[i];
                const arrayBuffer = await segment.blob.arrayBuffer();
                videoFolder.file(`segment_${i + 1}_${segment.id}.webm`, arrayBuffer);
            }

            // 4. Audio segments
            const audioFolder = zip.folder('audio');
            for (let i = 0; i < mediaRecorder.audioSegments.length; i++) {
                const segment = mediaRecorder.audioSegments[i];
                const arrayBuffer = await segment.blob.arrayBuffer();
                audioFolder.file(`segment_${i + 1}_${segment.id}.wav`, arrayBuffer);
            }

            // 5. Features (mock data for now)
            const featuresFolder = zip.folder('features');
            const mockFeatures = this.generateMockFeatures(dataLogger.logs);
            featuresFolder.file('extracted_features.json', JSON.stringify(mockFeatures, null, 2));

            // 6. Report HTML
            const reportHtml = this.generateReportHTML(metadata, dataLogger.logs, mockFeatures);
            zip.file('report.html', reportHtml);

            // 7. README
            const readme = this.generateReadme(sessionId, timestamp);
            zip.file('README.txt', readme);

            // Generate ZIP
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Save file
            const filename = `ADCare_${sessionId}_${timestamp}.zip`;
            saveAs(zipBlob, filename);

            alert(`数据导出成功！\n文件名: ${filename}\n包含: ${mediaRecorder.videoSegments.length} 个视频片段, ${mediaRecorder.audioSegments.length} 个音频片段`);

        } catch (error) {
            console.error('Export error:', error);
            alert('导出过程中出现错误: ' + error.message);
        } finally {
            this.exportInProgress = false;
        }
    }

    generateMockFeatures(logs) {
        const eventCounts = {};
        const taskEvents = [];
        let totalDuration = 0;

        logs.forEach(log => {
            eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
            
            if (log.eventType === 'task_switch' || log.eventType === 'task_response') {
                taskEvents.push(log);
            }
            
            if (log.eventData && log.eventData.duration) {
                totalDuration += log.eventData.duration;
            }
        });

        return {
            summary: {
                totalEvents: logs.length,
                uniqueEventTypes: Object.keys(eventCounts).length,
                totalDuration: totalDuration
            },
            eventDistribution: eventCounts,
            taskPerformance: this.analyzeTaskPerformance(taskEvents),
            temporalFeatures: this.extractTemporalFeatures(logs),
            timestamp: Date.now()
        };
    }

    analyzeTaskPerformance(taskEvents) {
        const tasks = {};
        
        taskEvents.forEach(event => {
            const task = event.eventData.task || 'unknown';
            if (!tasks[task]) {
                tasks[task] = {
                    attempts: 0,
                    responses: [],
                    totalTime: 0
                };
            }
            
            if (event.eventType === 'task_response') {
                tasks[task].attempts++;
                tasks[task].responses.push({
                    correct: event.eventData.correct,
                    reactionTime: event.eventData.reactionTime,
                    timestamp: event.timestamp
                });
            }
        });

        return tasks;
    }

    extractTemporalFeatures(logs) {
        if (logs.length < 2) return null;

        const timestamps = logs.map(l => l.timestamp);
        const intervals = [];
        
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const maxInterval = Math.max(...intervals);
        const minInterval = Math.min(...intervals);

        return {
            averageInterval: avgInterval,
            maxInterval: maxInterval,
            minInterval: minInterval,
            totalTimeSpan: timestamps[timestamps.length - 1] - timestamps[0]
        };
    }

    generateReportHTML(metadata, logs, features) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AD-Care 评估报告 - ${metadata.sessionId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2563eb; }
        .section { background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin: 1rem 0; }
        .metric { display: inline-block; margin: 0.5rem 1rem 0.5rem 0; }
        .metric-value { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 0.875rem; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .success { color: #22c55e; }
        .warning { color: #f59e0b; }
    </style>
</head>
<body>
    <h1>AD-Care 多模态认知评估报告</h1>
    <p>会话ID: <strong>${metadata.sessionId}</strong></p>
    <p>评估时间: ${new Date(metadata.startTime).toLocaleString()}</p>
    
    <div class="section">
        <h2>评估概览</h2>
        <div class="metric">
            <div class="metric-value">${logs.length}</div>
            <div class="metric-label">交互事件</div>
        </div>
        <div class="metric">
            <div class="metric-value">${features.summary.uniqueEventTypes}</div>
            <div class="metric-label">事件类型</div>
        </div>
        <div class="metric">
            <div class="metric-value">${Math.floor(features.summary.totalDuration / 1000)}s</div>
            <div class="metric-label">总时长</div>
        </div>
    </div>

    <div class="section">
        <h2>事件分布</h2>
        <table>
            <tr><th>事件类型</th><th>次数</th></tr>
            ${Object.entries(features.eventDistribution).map(([type, count]) => 
                `<tr><td>${type}</td><td>${count}</td></tr>`
            ).join('')}
        </table>
    </div>

    <div class="section">
        <h2>数据完整性</h2>
        <p>视频片段: ${metadata.videoSegments} 个</p>
        <p>音频片段: ${metadata.audioSegments} 个</p>
        <p>交互日志: ${metadata.totalLogs} 条</p>
    </div>

    <div class="section">
        <h2>说明</h2>
        <p>本报告由 AD-Care 系统自动生成。所有数据均在本地处理，未上传至任何服务器。</p>
        <p>详细的多模态数据已包含在导出文件的 video/、audio/ 和 features/ 目录中。</p>
    </div>
</body>
</html>`;
    }

    generateReadme(sessionId, timestamp) {
        return `AD-Care 多模态认知评估数据导出
=====================================

会话ID: ${sessionId}
导出时间: ${timestamp}

文件说明:
- metadata.json: 评估会话元数据
- interaction_log.jsonl: 交互日志（JSON Lines格式）
- video/: 视频片段目录（WebM格式）
- audio/: 音频片段目录（WAV格式）
- features/: 提取的特征数据
- report.html: 可视化报告（可直接用浏览器打开）

注意事项:
1. 所有数据仅在本地设备处理
2. 视频分辨率为640x480，帧率15fps
3. 音频采样率为16000Hz，单声道
4. 时间戳统一使用毫秒级精度

技术支持: AD-Care Team
`;
    }
}
