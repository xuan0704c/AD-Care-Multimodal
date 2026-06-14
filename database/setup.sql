-- 智慧忆护 AD-Care 数据库初始化脚本
-- MySQL 5.7+ 兼容

CREATE DATABASE IF NOT EXISTS adcare DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE adcare;

-- 医护人员表
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    name VARCHAR(50) NOT NULL DEFAULT '' COMMENT '姓名',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    department VARCHAR(100) DEFAULT NULL COMMENT '科室',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医护人员账号表';

-- 患者表
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL COMMENT '所属医护人员ID',
    name VARCHAR(50) NOT NULL DEFAULT '' COMMENT '姓名',
    age INT DEFAULT NULL COMMENT '年龄',
    gender VARCHAR(10) DEFAULT NULL COMMENT '性别',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    id_card VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    address VARCHAR(255) DEFAULT NULL COMMENT '住址',
    emergency_contact VARCHAR(50) DEFAULT NULL COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) DEFAULT NULL COMMENT '紧急联系电话',
    status ENUM('pending','reporting','risk','review','good') DEFAULT 'pending' COMMENT '状态:待筛查/报告生成中/高风险/复查中/正常',
    risk_level ENUM('low','medium','high') DEFAULT NULL COMMENT '风险等级',
    reg_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建档时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    INDEX idx_staff_id (staff_id),
    INDEX idx_status (status),
    INDEX idx_reg_time (reg_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='患者档案表';

-- 评估会话表
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL COMMENT '所属医护人员ID',
    patient_id INT DEFAULT NULL COMMENT '关联患者ID',
    session_id VARCHAR(64) NOT NULL COMMENT '前端会话标识',
    patient_name VARCHAR(50) DEFAULT NULL COMMENT '患者姓名(会话记录)',
    start_time BIGINT DEFAULT NULL COMMENT '开始时间戳(毫秒)',
    end_time BIGINT DEFAULT NULL COMMENT '结束时间戳(毫秒)',
    data_size INT DEFAULT 0 COMMENT '数据大小(字节)',
    risk_level ENUM('low','medium','high') DEFAULT NULL COMMENT '风险等级',
    status ENUM('active','completed','abandoned') DEFAULT 'active' COMMENT '会话状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    UNIQUE KEY uk_session (staff_id, session_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估会话表';

-- 评估数据日志表（存储传感器等详细数据）
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL COMMENT '关联会话ID',
    log_type VARCHAR(50) DEFAULT NULL COMMENT '日志类型',
    log_data JSON DEFAULT NULL COMMENT '日志数据(JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估数据日志表';

-- 插入默认医护人员账号 (密码: 123456)
-- 使用 PHP password_hash('123456', PASSWORD_DEFAULT) 生成
INSERT INTO staff (username, password_hash, name, department) VALUES
('doctor1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李医生', '神经内科'),
('doctor2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王医生', '老年科')
ON DUPLICATE KEY UPDATE id=id;
