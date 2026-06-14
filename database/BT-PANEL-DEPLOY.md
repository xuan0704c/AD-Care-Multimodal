# 宝塔面板部署教程（详细版）

## 一、环境准备

### 1.1 安装宝塔面板（如已安装请跳过）

```bash
# CentOS
curl -sSO https://download.bt.cn/install/install_panel.sh && bash install_panel.sh

# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

安装完成后，记录面板地址、用户名和密码。

### 1.2 安装运行环境

登录宝塔面板 → 软件商店 → 一键安装以下环境：

| 软件 | 版本 | 说明 |
|------|------|------|
| Nginx | 1.22+ | Web 服务器 |
| MySQL | 5.7 | 数据库 |
| PHP | 8.0 | 后端语言 |
| phpMyAdmin | 5.x | 数据库管理工具 |

安装路径：宝塔面板 → 软件商店 → 运行环境 → 选择对应版本安装

---

## 二、创建网站

### 2.1 添加站点

宝塔面板 → 网站 → 添加站点：

- **域名**：填写你的域名，如 `adcare.yourdomain.com`（没有域名可填服务器 IP）
- **根目录**：`/www/wwwroot/adcare`
- **FTP**：可选创建
- **数据库**：选择 **MySQL**，设置数据库名、用户名、密码（建议记录）
- **PHP 版本**：选择 **8.0**

点击提交，系统会自动创建网站目录和数据库。

### 2.2 配置 PHP 扩展

宝塔面板 → 软件商店 → 已安装 → 找到 PHP-8.0 → 设置 → 安装扩展：

确保以下扩展已安装：
- `pdo_mysql`（通常默认已装）
- `json`（通常默认已装）
- `mbstring`（通常默认已装）
- `fileinfo`

如未安装，点击对应扩展后面的"安装"按钮。

---

## 三、上传项目代码

### 3.1 打包本地代码

在本地项目根目录，将以下文件/文件夹打包为 `adcare.zip`：

```
index.html
portal/           (login.html, dashboard.html, patients.html, report.html, realtime.html, assessment-report.html...)
api/              (config.php, auth.php, patients.php, sessions.php, reports.php)
js/               (api-client.js, core/...)
sample/           (report.html)
css/              (如有)
assets/           (如有)
```

**注意**：不需要上传 `.git` 文件夹。

### 3.2 上传到服务器

宝塔面板 → 文件 → 进入 `/www/wwwroot/adcare`：

1. 点击"上传"按钮
2. 选择本地的 `adcare.zip`
3. 上传完成后，右键点击压缩包 → 解压
4. 确保 `api/` 文件夹在网站根目录下，即 `/www/wwwroot/adcare/api/`

### 3.3 检查文件结构

解压后，网站根目录应为：

```
/www/wwwroot/adcare/
├── index.html              # 评估系统首页
├── portal/
│   ├── login.html          # 登录页
│   ├── dashboard.html      # 工作台
│   ├── patients.html       # 患者管理
│   ├── report.html         # 报告查询
│   ├── realtime.html       # 实时监测
│   ├── assessment-report.html  # 评估报告
│   └── ...
├── api/
│   ├── config.php          # 数据库配置
│   ├── auth.php
│   ├── patients.php
│   ├── sessions.php
│   └── reports.php
├── js/
│   ├── api-client.js       # API 客户端
│   └── core/
├── database/
│   ├── setup.sql           # 数据库初始化脚本
│   └── README.md
└── ...
```

---

## 四、导入数据库

### 4.1 通过 phpMyAdmin 导入

宝塔面板 → 数据库 → 找到刚才创建的数据库 → 点击"管理"（会打开 phpMyAdmin）：

1. 在 phpMyAdmin 左侧，点击你的数据库名
2. 点击顶部菜单"导入"
3. 点击"选择文件"，选择项目中的 `database/setup.sql`
4. 点击"执行"

导入成功后，左侧会显示以下表：
- `staff`
- `patients`
- `assessment_sessions`
- `session_logs`

### 4.2 验证默认账号

导入后，`staff` 表中已有两条默认数据：

| 账号 | 密码 | 姓名 |
|------|------|------|
| doctor1 | 123456 | 李医生 |
| doctor2 | 123456 | 王医生 |

---

## 五、配置数据库连接

### 5.1 修改 api/config.php

宝塔面板 → 文件 → 进入 `/www/wwwroot/adcare/api/config.php` → 双击编辑：

```php
<?php
/**
 * 智慧忆护 AD-Care 后端配置
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ========== 修改以下数据库配置 ==========
define('DB_HOST', 'localhost');
define('DB_NAME', 'adcare');           // 宝塔创建数据库时填写的数据库名
define('DB_USER', 'adcare_user');      // 宝塔创建数据库时填写的用户名
define('DB_PASS', 'your_password');    // 宝塔创建数据库时填写的密码
define('DB_CHARSET', 'utf8mb4');
// ========================================
```

**保存文件**。

### 5.2 测试数据库连接

创建一个测试文件 `/www/wwwroot/adcare/api/test.php`：

```php
<?php
require_once 'config.php';
try {
    $db = getDB();
    echo json_encode(['success' => true, 'message' => '数据库连接成功']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
```

浏览器访问：`http://你的域名/api/test.php`

如果返回 `{"success":true,"message":"数据库连接成功"}`，说明配置正确。

测试完成后可删除 `test.php`。

---

## 六、配置 Nginx（重要）

### 6.1 配置 API 跨域和伪静态

宝塔面板 → 网站 → 找到你的站点 → 设置 → 配置文件：

在 `server { ... }` 内添加以下内容：

```nginx
    # API 路径配置
    location /api/ {
        # 允许跨域（如前后端分离部署时需要）
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,X-Staff-Id' always;
        
        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # PHP 处理
        location ~ \.php$ {
            fastcgi_pass unix:/tmp/php-cgi-80.sock;  # 根据实际 PHP 版本调整
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
```

**注意**：`fastcgi_pass` 的值需要与你的 PHP 版本对应：
- PHP 8.0 通常是 `unix:/tmp/php-cgi-80.sock`
- 也可以在宝塔 → 网站 → 设置 → PHP 版本 中查看对应配置

### 6.2 配置默认首页

宝塔面板 → 网站 → 设置 → 默认文档：

确保 `index.html` 在列表中。如果希望默认访问门户登录页，可以添加 `portal/login.html`。

---

## 七、配置前端 API 地址

### 7.1 修改 api-client.js

宝塔面板 → 文件 → 进入 `/www/wwwroot/adcare/js/api-client.js` → 双击编辑：

找到第 11 行：

```javascript
var API_BASE = window.API_BASE || 'api/';
```

如果项目部署在网站根目录，保持 `'api/'` 即可。

如果部署在子目录（如 `http://域名/adcare/`），需要修改为：

```javascript
var API_BASE = window.API_BASE || '/adcare/api/';
```

**保存文件**。

---

## 八、访问测试

### 8.1 测试登录页

浏览器访问：`http://你的域名/portal/login.html`

输入默认账号：
- 账号：`doctor1`
- 密码：`123456`

点击"进入系统"，如果跳转到 `dashboard.html`，说明后端登录 API 正常工作。

### 8.2 测试患者管理

进入工作台 → 患者列表 → 尝试新建患者，看是否能成功保存到数据库。

### 8.3 检查数据库数据

宝塔面板 → 数据库 → 管理 → 查看 `patients` 表，确认新建的患者数据已写入。

---

## 九、常见问题排查

### 9.1 登录提示"网络请求失败"

1. 按 F12 打开浏览器开发者工具 → Network 标签
2. 查看 `auth.php?action=login` 请求是否 404
3. 如果是 404，检查文件是否上传到 `/www/wwwroot/adcare/api/auth.php`
4. 检查 Nginx 配置中的 PHP 路径是否正确

### 9.2 数据库连接失败

1. 检查 `api/config.php` 中的数据库用户名和密码是否正确
2. 宝塔面板 → 数据库 → 确认数据库已创建且用户有权限
3. 检查 MySQL 是否运行：宝塔 → 软件商店 → MySQL → 状态

### 9.3 跨域问题（CORS）

如果前端提示跨域错误：
1. 确认 Nginx 配置中已添加 `Access-Control-Allow-Origin` 头
2. 确认 `api/config.php` 中已设置跨域头
3. 如果前端通过 IP 直接访问，尝试改为域名访问

### 9.4 PHP 文件无法执行

1. 宝塔 → 软件商店 → PHP-8.0 → 设置 → 配置文件
2. 确保 `cgi.fix_pathinfo=1`
3. 重启 PHP 服务

---

## 十、安全建议

1. **修改默认密码**：登录后立即修改 `doctor1` 和 `doctor2` 的密码
2. **关闭目录列表**：宝塔 → 网站 → 设置 → 配置文件，确保没有 `autoindex on`
3. **设置 HTTPS**：宝塔 → 网站 → SSL → 申请 Let's Encrypt 免费证书
4. **数据库安全**：不要使用 root 账号连接数据库，使用宝塔创建的专用数据库用户
5. **定期备份**：宝塔 → 计划任务 → 添加数据库备份任务
