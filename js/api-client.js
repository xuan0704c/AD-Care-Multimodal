/**
 * 智慧忆护 AD-Care API 客户端
 * 用于前端与 PHP 后端通信
 * 配置：MySQL 5.7 + PHP 8.0
 */

(function(window) {
    'use strict';

    // API 基础地址，请根据实际部署路径修改
    var API_BASE = window.API_BASE || 'api/';

    // 获取保存的登录信息
    function getAuth() {
        try {
            return JSON.parse(localStorage.getItem('adcare_auth') || '{}');
        } catch (e) {
            return {};
        }
    }

    // 保存登录信息
    function setAuth(auth) {
        localStorage.setItem('adcare_auth', JSON.stringify(auth || {}));
    }

    // 清除登录信息
    function clearAuth() {
        localStorage.removeItem('adcare_auth');
        localStorage.removeItem('staff_info');
    }

    // 获取当前用户ID
    function getStaffId() {
        var auth = getAuth();
        return auth.staffId || null;
    }

    // 通用请求封装
    function request(method, url, data) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, API_BASE + url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            // 添加认证头
            var staffId = getStaffId();
            if (staffId) {
                xhr.setRequestHeader('X-Staff-Id', staffId);
            }

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var resp;
                    try {
                        resp = JSON.parse(xhr.responseText);
                    } catch (e) {
                        resp = { error: '服务器返回格式错误' };
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(resp);
                    } else if (xhr.status === 401) {
                        clearAuth();
                        window.location.href = 'login.html';
                        reject(resp);
                    } else {
                        reject(resp);
                    }
                }
            };

            xhr.onerror = function() {
                reject({ error: '网络请求失败，请检查服务器连接' });
            };

            xhr.send(data ? JSON.stringify(data) : null);
        });
    }

    // API 方法
    var API = {
        // 认证相关
        auth: {
            login: function(username, password) {
                return request('POST', 'auth.php?action=login', {
                    username: username,
                    password: password
                }).then(function(resp) {
                    if (resp.success && resp.staff) {
                        setAuth({
                            staffId: resp.staff.id,
                            username: resp.staff.username,
                            name: resp.staff.name
                        });
                        localStorage.setItem('staff_info', JSON.stringify(resp.staff));
                    }
                    return resp;
                });
            },
            logout: function() {
                return request('POST', 'auth.php?action=logout', {}).then(function(resp) {
                    clearAuth();
                    return resp;
                });
            },
            me: function() {
                return request('GET', 'auth.php?action=me', null);
            }
        },

        // 患者管理
        patients: {
            list: function(params) {
                var query = [];
                if (params && params.status) query.push('status=' + encodeURIComponent(params.status));
                if (params && params.search) query.push('search=' + encodeURIComponent(params.search));
                var url = 'patients.php' + (query.length ? '?' + query.join('&') : '');
                return request('GET', url, null);
            },
            create: function(data) {
                return request('POST', 'patients.php', data);
            },
            update: function(id, data) {
                return request('PUT', 'patients.php?id=' + id, data);
            },
            delete: function(id) {
                return request('DELETE', 'patients.php?id=' + id, null);
            }
        },

        // 评估会话
        sessions: {
            list: function(params) {
                var query = [];
                if (params && params.status) query.push('status=' + encodeURIComponent(params.status));
                if (params && params.patient_id) query.push('patient_id=' + encodeURIComponent(params.patient_id));
                var url = 'sessions.php' + (query.length ? '?' + query.join('&') : '');
                return request('GET', url, null);
            },
            save: function(data) {
                return request('POST', 'sessions.php', data);
            },
            update: function(id, data) {
                return request('PUT', 'sessions.php?id=' + id, data);
            },
            delete: function(id) {
                return request('DELETE', 'sessions.php?id=' + id, null);
            }
        },

        // 报告查询
        reports: {
            list: function(params) {
                var query = [];
                if (params && params.risk_level) query.push('risk_level=' + encodeURIComponent(params.risk_level));
                var url = 'reports.php' + (query.length ? '?' + query.join('&') : '');
                return request('GET', url, null);
            },
            detail: function(id) {
                return request('GET', 'reports.php?id=' + id, null);
            }
        },

        // 工具方法
        isLoggedIn: function() {
            return !!getStaffId();
        },
        getStaffId: getStaffId,
        getAuth: getAuth,
        clearAuth: clearAuth
    };

    // 暴露到全局
    window.ADCareAPI = API;

})(window);
