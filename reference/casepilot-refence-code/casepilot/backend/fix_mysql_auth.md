# 修复MySQL root用户认证问题

如果遇到 `Access denied for user 'root'@'localhost'` 错误，可能是因为MySQL的root用户使用了 `auth_socket` 插件而不是密码认证。

## 解决方案

### 方法1：修改root用户使用密码认证（推荐）

```bash
# 使用sudo权限登录MySQL（不需要密码）
sudo mysql

# 在MySQL中执行以下命令
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的密码';
FLUSH PRIVILEGES;
EXIT;
```

然后更新 `.env` 文件中的 `DB_PASSWORD` 为你设置的密码。

### 方法2：创建新的数据库用户（更安全）

```bash
# 使用sudo权限登录MySQL
sudo mysql

# 创建新用户
CREATE USER 'casepilot'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON casepilot.* TO 'casepilot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

然后更新 `.env` 文件：
```
DB_USER=casepilot
DB_PASSWORD=你的密码
```

### 方法3：使用sudo运行（临时方案，不推荐）

如果只是临时测试，可以使用sudo运行：
```bash
sudo npm run dev
```

但这不是推荐的生产环境方案。

## 验证连接

修复后，测试连接：
```bash
mysql -u root -p你的密码 -e "SELECT 1;"
```

或使用新用户：
```bash
mysql -u casepilot -p你的密码 -e "SELECT 1;"
```

