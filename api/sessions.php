<?php
/**
 * 评估会话 API
 * GET    /api/sessions.php              获取会话列表
 * POST   /api/sessions.php              创建/更新会话
 * PUT    /api/sessions.php?id=xxx       更新会话
 * DELETE /api/sessions.php?id=xxx       删除会话
 */
require_once 'config.php';

$staff = requireAuth();
$staffId = $staff['id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetSessions($staffId);
        break;
    case 'POST':
        handleCreateOrUpdateSession($staffId);
        break;
    case 'PUT':
        handleUpdateSession($staffId);
        break;
    case 'DELETE':
        handleDeleteSession($staffId);
        break;
    default:
        jsonResponse(405, ['error' => '不支持的请求方法']);
}

function handleGetSessions($staffId) {
    $db = getDB();
    $status = $_GET['status'] ?? '';
    $patientId = $_GET['patient_id'] ?? '';
    
    $sql = 'SELECT id, patient_id, session_id, patient_name, start_time, end_time, data_size, risk_level, status, created_at FROM assessment_sessions WHERE staff_id = ?';
    $params = [$staffId];
    
    if ($status) {
        $sql .= ' AND status = ?';
        $params[] = $status;
    }
    
    if ($patientId) {
        $sql .= ' AND patient_id = ?';
        $params[] = (int)$patientId;
    }
    
    $sql .= ' ORDER BY created_at DESC';
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $sessions = $stmt->fetchAll();
    
    jsonResponse(200, ['success' => true, 'sessions' => $sessions]);
}

function handleCreateOrUpdateSession($staffId) {
    $data = getJsonInput();
    $sessionId = $data['sessionId'] ?? '';
    
    if (empty($sessionId)) {
        jsonResponse(400, ['error' => '缺少会话标识']);
    }
    
    $db = getDB();
    
    // 检查是否已存在
    $stmt = $db->prepare('SELECT id FROM assessment_sessions WHERE staff_id = ? AND session_id = ?');
    $stmt->execute([$staffId, $sessionId]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // 更新
        $fields = [];
        $params = [];
        
        if (isset($data['patientId'])) { $fields[] = 'patient_id = ?'; $params[] = $data['patientId']; }
        if (isset($data['patientName'])) { $fields[] = 'patient_name = ?'; $params[] = $data['patientName']; }
        if (isset($data['startTime'])) { $fields[] = 'start_time = ?'; $params[] = $data['startTime']; }
        if (isset($data['endTime'])) { $fields[] = 'end_time = ?'; $params[] = $data['endTime']; }
        if (isset($data['dataSize'])) { $fields[] = 'data_size = ?'; $params[] = $data['dataSize']; }
        if (isset($data['riskLevel'])) { $fields[] = 'risk_level = ?'; $params[] = $data['riskLevel']; }
        if (isset($data['status'])) { $fields[] = 'status = ?'; $params[] = $data['status']; }
        
        if (!empty($fields)) {
            $params[] = $existing['id'];
            $sql = 'UPDATE assessment_sessions SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }
        
        jsonResponse(200, ['success' => true, 'id' => $existing['id'], 'message' => '会话更新成功']);
    } else {
        // 新建
        $stmt = $db->prepare('INSERT INTO assessment_sessions (staff_id, patient_id, session_id, patient_name, start_time, end_time, data_size, risk_level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $staffId,
            $data['patientId'] ?? null,
            $sessionId,
            $data['patientName'] ?? null,
            $data['startTime'] ?? null,
            $data['endTime'] ?? null,
            $data['dataSize'] ?? 0,
            $data['riskLevel'] ?? null,
            $data['status'] ?? 'active'
        ]);
        
        $id = $db->lastInsertId();
        jsonResponse(200, ['success' => true, 'id' => $id, 'message' => '会话创建成功']);
    }
}

function handleUpdateSession($staffId) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(400, ['error' => '缺少会话ID']);
    }
    
    $data = getJsonInput();
    $db = getDB();
    
    // 验证权限
    $stmt = $db->prepare('SELECT id FROM assessment_sessions WHERE id = ? AND staff_id = ?');
    $stmt->execute([$id, $staffId]);
    if (!$stmt->fetch()) {
        jsonResponse(403, ['error' => '无权操作该会话']);
    }
    
    $fields = [];
    $params = [];
    
    if (isset($data['patientId'])) { $fields[] = 'patient_id = ?'; $params[] = $data['patientId']; }
    if (isset($data['patientName'])) { $fields[] = 'patient_name = ?'; $params[] = $data['patientName']; }
    if (isset($data['startTime'])) { $fields[] = 'start_time = ?'; $params[] = $data['startTime']; }
    if (isset($data['endTime'])) { $fields[] = 'end_time = ?'; $params[] = $data['endTime']; }
    if (isset($data['dataSize'])) { $fields[] = 'data_size = ?'; $params[] = $data['dataSize']; }
    if (isset($data['riskLevel'])) { $fields[] = 'risk_level = ?'; $params[] = $data['riskLevel']; }
    if (isset($data['status'])) { $fields[] = 'status = ?'; $params[] = $data['status']; }
    
    if (empty($fields)) {
        jsonResponse(400, ['error' => '没有要更新的字段']);
    }
    
    $params[] = $id;
    $sql = 'UPDATE assessment_sessions SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    jsonResponse(200, ['success' => true, 'message' => '更新成功']);
}

function handleDeleteSession($staffId) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(400, ['error' => '缺少会话ID']);
    }
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM assessment_sessions WHERE id = ? AND staff_id = ?');
    $stmt->execute([$id, $staffId]);
    
    if ($stmt->rowCount() === 0) {
        jsonResponse(404, ['error' => '会话不存在或无权删除']);
    }
    
    jsonResponse(200, ['success' => true, 'message' => '删除成功']);
}
