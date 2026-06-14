<?php
/**
 * 智慧忆护 AD-Care 后端配置
 * MySQL 5.7 + PHP 8.0
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 数据库配置 - 请根据服务器实际情况修改
define('DB_HOST', 'localhost');
define('DB_NAME', 'adcare');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// 连接数据库
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            jsonResponse(500, ['error' => '数据库连接失败: ' . $e->getMessage()]);
        }
    }
    return $pdo;
}

// 统一 JSON 响应
function jsonResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// 获取请求体 JSON
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// 检查登录状态（通过请求头中的 token，这里简化为 staff_id）
function requireAuth() {
    $headers = getallheaders();
    $staffId = null;
    
    // 支持通过 X-Staff-Id 请求头或 session 传递
    if (isset($headers['X-Staff-Id']) && is_numeric($headers['X-Staff-Id'])) {
        $staffId = (int)$headers['X-Staff-Id'];
    } elseif (isset($_SESSION['staff_id'])) {
        $staffId = (int)$_SESSION['staff_id'];
    }
    
    if (!$staffId) {
        jsonResponse(401, ['error' => '未登录或登录已过期']);
    }
    
    // 验证用户是否存在
    $db = getDB();
    $stmt = $db->prepare('SELECT id, username, name FROM staff WHERE id = ?');
    $stmt->execute([$staffId]);
    $staff = $stmt->fetch();
    
    if (!$staff) {
        jsonResponse(401, ['error' => '用户不存在']);
    }
    
    return $staff;
}

// 启动 session
session_start();
