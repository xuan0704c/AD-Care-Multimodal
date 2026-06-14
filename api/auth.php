<?php
/**
 * 登录认证 API
 * POST /api/auth.php?action=login    登录
 * POST /api/auth.php?action=logout   登出
 * GET  /api/auth.php?action=me       获取当前用户信息
 */
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'me':
        handleMe();
        break;
    default:
        jsonResponse(400, ['error' => '未知操作']);
}

function handleLogin() {
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        jsonResponse(400, ['error' => '账号和密码不能为空']);
    }
    
    $db = getDB();
    $stmt = $db->prepare('SELECT id, username, password_hash, name, department FROM staff WHERE username = ?');
    $stmt->execute([$username]);
    $staff = $stmt->fetch();
    
    if (!$staff || !password_verify($password, $staff['password_hash'])) {
        jsonResponse(401, ['error' => '账号或密码错误']);
    }
    
    // 写入 session
    $_SESSION['staff_id'] = $staff['id'];
    $_SESSION['staff_name'] = $staff['name'];
    
    jsonResponse(200, [
        'success' => true,
        'staff' => [
            'id' => $staff['id'],
            'username' => $staff['username'],
            'name' => $staff['name'],
            'department' => $staff['department']
        ]
    ]);
}

function handleLogout() {
    session_destroy();
    jsonResponse(200, ['success' => true, 'message' => '已登出']);
}

function handleMe() {
    $staff = requireAuth();
    jsonResponse(200, [
        'success' => true,
        'staff' => [
            'id' => $staff['id'],
            'username' => $staff['username'],
            'name' => $staff['name']
        ]
    ]);
}
