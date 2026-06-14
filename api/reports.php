<?php
/**
 * 报告查询 API
 * GET /api/reports.php              获取报告列表（基于已完成的评估会话）
 * GET /api/reports.php?id=xxx       获取单个报告详情
 */
require_once 'config.php';

$staff = requireAuth();
$staffId = $staff['id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonResponse(405, ['error' => '不支持的请求方法']);
}

$reportId = $_GET['id'] ?? '';

if ($reportId) {
    handleGetReportDetail($staffId, $reportId);
} else {
    handleGetReports($staffId);
}

function handleGetReports($staffId) {
    $db = getDB();
    $riskLevel = $_GET['risk_level'] ?? '';
    
    // 关联患者表查询，获取已完成的会话作为报告
    $sql = '
        SELECT 
            s.id AS report_id,
            s.session_id,
            s.patient_id,
            s.patient_name,
            s.start_time,
            s.end_time,
            s.data_size,
            s.risk_level,
            s.created_at,
            p.name AS patient_real_name,
            p.age AS patient_age,
            p.gender AS patient_gender
        FROM assessment_sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
        WHERE s.staff_id = ? AND s.status = ?
    ';
    $params = [$staffId, 'completed'];
    
    if ($riskLevel) {
        $sql .= ' AND s.risk_level = ?';
        $params[] = $riskLevel;
    }
    
    $sql .= ' ORDER BY s.end_time DESC';
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $reports = $stmt->fetchAll();
    
    // 格式化数据
    $formatted = array_map(function($r) {
        return [
            'id' => $r['report_id'],
            'sessionId' => $r['session_id'],
            'patientId' => $r['patient_id'],
            'patientName' => $r['patient_real_name'] ?: $r['patient_name'] ?: '未知患者',
            'patientAge' => $r['patient_age'],
            'patientGender' => $r['patient_gender'],
            'startTime' => (int)$r['start_time'],
            'endTime' => (int)$r['end_time'],
            'dataSize' => (int)$r['data_size'],
            'riskLevel' => $r['risk_level'],
            'createdAt' => $r['created_at']
        ];
    }, $reports);
    
    jsonResponse(200, ['success' => true, 'reports' => $formatted]);
}

function handleGetReportDetail($staffId, $reportId) {
    $db = getDB();
    
    $sql = '
        SELECT 
            s.id AS report_id,
            s.session_id,
            s.patient_id,
            s.patient_name,
            s.start_time,
            s.end_time,
            s.data_size,
            s.risk_level,
            s.created_at,
            p.name AS patient_real_name,
            p.age AS patient_age,
            p.gender AS patient_gender
        FROM assessment_sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
        WHERE s.id = ? AND s.staff_id = ?
    ';
    
    $stmt = $db->prepare($sql);
    $stmt->execute([(int)$reportId, $staffId]);
    $report = $stmt->fetch();
    
    if (!$report) {
        jsonResponse(404, ['error' => '报告不存在']);
    }
    
    jsonResponse(200, [
        'success' => true,
        'report' => [
            'id' => $report['report_id'],
            'sessionId' => $report['session_id'],
            'patientId' => $report['patient_id'],
            'patientName' => $report['patient_real_name'] ?: $report['patient_name'] ?: '未知患者',
            'patientAge' => $report['patient_age'],
            'patientGender' => $report['patient_gender'],
            'startTime' => (int)$report['start_time'],
            'endTime' => (int)$report['end_time'],
            'dataSize' => (int)$report['data_size'],
            'riskLevel' => $report['risk_level'],
            'createdAt' => $report['created_at']
        ]
    ]);
}
