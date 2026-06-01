# ETF 投研平台 — 账号密码汇总

> **重要提示**：此文件包含系统登录凭据，请妥善保管，勿泄露给未授权人员。

---

## 账号列表

| 用户名 | 密码 | 角色 | 备注 |
|--------|------|------|------|
| admin | admin123 | admin | 系统管理员 |
| Aidan | 19880402 | user | 普通用户 |
| Tee | 19790615 | user | 普通用户 |
| Zack | 19911213 | user | 普通用户 |
| Philip | 19900225 | user | 普通用户 |

---

## 登录地址

- **开发环境**：http://localhost:5173/
- **生产环境**：http://localhost:8000/（前端静态文件由后端服务）

## API 登录接口

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

*生成时间：2026-06-02*
