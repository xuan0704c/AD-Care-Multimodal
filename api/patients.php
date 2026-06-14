<?php
/**
 * 患者管理 API
 * GET    /api/patients.php              获取患者列表
 * POST   /api/patients.php              新增患者
 * PUT    /api/patients.php?id=xxx       更新患者
 * DELETE /api/patients.php?id=xxx       删除患者
 */
require_once 'config.php';

$staff = requireAuth();
$staffId = $staff['id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetPatients($staffId);
        break;
    case 'POST':
        handleCreatePatient($staffId);
        break;
    case 'PUT':
        handleUpdatePatient($staffId);
        break;
    case 'DELETE':
        handleDeletePatient($staffId);
        break;
    default:
        jsonResponse(405, ['error' => '不支持的请求方法']);
}

function handleGetPatients($staffId) {
    $db = getDB();
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';
    
    $sql = 'SELECT id, name, age, gender, phone, id_card, address, emergency_contact, emergency_phone, status, risk_level, reg_time, updated_at FROM patients WHERE staff_id = ?';
    $params = [$staffId];
    
    if ($status) {
        $sql .= ' AND status = ?';
        $params[] = $status;
    }
    
    if ($search) {
        $sql .= ' AND (name LIKE ? OR phone LIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }
    
    $sql .= ' ORDER BY reg_time DESC';
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $patients = $stmt->fetchAll();
    
    jsonResponse(200, ['success' => true, 'patients' => $patients]);
}

function handleCreatePatient($staffId) {
    $data = getJsonInput();
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) {
        jsonResponse(400, ['error' => '患者姓名不能为空']);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO patients (staff_id, name, age, gender, phone, id_card, address, emergency_contact, emergency_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $staffId,
        $name,
        $data['age'] ?? null,
        $data['gender'] ?? null,
        $data['phone'] ?? null,
        $data['idCard'] ?? null,
        $data['address'] ?? null,
        $data['emergencyContact'] ?? null,
        $data['emergencyPhone'] ?? null,
        $data['status'] ?? 'pending'
    ]);
    
    $id = $db->lastInsertId();
    jsonResponse(200, ['success' => true, 'id' => $id, 'message' => '患者档案创建成功']);
}

function handleUpdatePatient($staffId) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(400, ['error' => '缺少患者ID']);
    }
    
    $data = getJsonInput();
    $db = getDB();
    
    // 验证权限
    $stmt = $db->prepare('SELECT id FROM patients WHERE id = ? AND staff_id = ?');
    $stmt->execute([$id, $staffId]);
    if (!$stmt->fetch()) {
        jsonResponse(403, ['error' => '无权操作该患者']);
    }
    
    $fields = [];
    $params = [];
    
    if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = $data['name']; }
    if (isset($data['age'])) { $fields[] = 'age = ?'; $params[] = $data['age']; }
    if (isset($data['gender'])) { $fields[] = 'gender = ?'; $params[] = $data['gender']; }
    if (isset($data['phone'])) { $fields[] = 'phone = ?'; $params[] = $data['phone']; }
    if (isset($data['status'])) { $fields[] = 'status = ?'; $params[] = $data['status']; }
    if (isset($data['risk_level'])) { $fields[] = 'risk_level = ?'; $params[] = $data['risk_level']; }
    
    if (empty($fields)) {
        jsonResponse(400, ['error' => '没有要更新的字段']);
    }
    
    $params[] = $id;
    $sql = 'UPDATE patients SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    jsonResponse(200, ['success' => true, 'message' => '更新成功']);
}

function handleDeletePatient($staffId) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(400, ['error' => '缺少患者ID']);
    }
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM patients WHERE id = ? AND staff_id = ?');
    $stmt->execute([$id, $staffId]);
    
    if ($stmt->rowCount() === 0) {
        jsonResponse(404, ['error' => '患者不存在或无权删除']);
    }
    
    jsonResponse(200, ['success' => true, 'message' => '删除成功']);
}
