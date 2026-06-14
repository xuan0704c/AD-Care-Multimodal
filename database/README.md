# 智慧忆护 AD-Care 后端部署说明

## 环境要求

- MySQL 5.7+
- PHP 8.0+
- phpMyAdmin（可选，用于管理数据库）

## 部署步骤

### 1. 导入数据库

使用 phpMyAdmin 或命令行导入 `database/setup.sql`：

```bash
mysql -u root -p < database/setup.sql
```

这会创建：
- 数据库 `adcare`
- 表 `staff`（医护人员账号）
- 表 `patients`（患者档案）
- 表 `assessment_sessions`（评估会话）
- 表 `session_logs`（评估数据日志）
- 默认账号：`doctor1` / `123456`，`doctor2` / `123456`

### 2. 修改数据库配置

编辑 `api/config.php`，修改数据库连接信息：

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'adcare');
define('DB_USER', 'root');       // 修改为你的数据库用户名
define('DB_PASS', '');           // 修改为你的数据库密码
define('DB_CHARSET', 'utf8mb4');
```

### 3. 确保 PHP 扩展已启用

确认 `php.ini` 中启用了以下扩展：

```ini
extension=pdo_mysql
extension=json
extension=mbstring
```

### 4. 配置 API 基础路径（前端）

如果项目部署在子目录中，需要修改 `js/api-client.js` 中的 `API_BASE`：

```javascript
var API_BASE = window.API_BASE || 'api/';
```

或者在页面中设置：

```javascript
window.API_BASE = '/你的路径/api/';
```

### 5. 文件权限

确保 `api/` 目录下的 PHP 文件有执行权限：

```bash
chmod -R 755 api/
```

## API 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `api/auth.php?action=login` | POST | 登录 |
| `api/auth.php?action=logout` | POST | 登出 |
| `api/auth.php?action=me` | GET | 获取当前用户信息 |
| `api/patients.php` | GET | 获取患者列表 |
| `api/patients.php` | POST | 新增患者 |
| `api/patients.php?id=xxx` | PUT | 更新患者 |
| `api/patients.php?id=xxx` | DELETE | 删除患者 |
| `api/sessions.php` | GET | 获取评估会话列表 |
| `api/sessions.php` | POST | 创建/更新会话 |
| `api/sessions.php?id=xxx` | PUT | 更新会话 |
| `api/sessions.php?id=xxx` | DELETE | 删除会话 |
| `api/reports.php` | GET | 获取报告列表 |
| `api/reports.php?id=xxx` | GET | 获取报告详情 |

## 认证方式

API 通过请求头 `X-Staff-Id` 或 PHP Session 进行认证。登录成功后，前端 `api-client.js` 会自动在请求头中携带 `X-Staff-Id`。

## 前端接入说明

1. 登录页已接入后端 API（`portal/login.html`）
2. 其他页面可逐步替换 `localStorage` 操作为 `ADCareAPI` 调用：

```javascript
// 获取患者列表
ADCareAPI.patients.list().then(function(resp) {
    console.log(resp.patients);
});

// 创建患者
ADCareAPI.patients.create({
    name: '张三',
    age: 75,
    gender: '男'
});

// 获取报告列表
ADCareAPI.reports.list().then(function(resp) {
    console.log(resp.reports);
});
```
