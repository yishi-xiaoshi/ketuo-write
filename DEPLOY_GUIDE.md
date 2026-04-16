# 可拓写作智能系统部署指南

> 部署平台：Netlify（免费）
> GitHub 仓库：https://github.com/yishi-xiaoshi/ketuo-write
> 网站地址：https://ketuowrite.netlify.app（部署后自动生成）

---

## 部署方式对比

| 方式 | 操作复杂度 | 自动更新 | 适用场景 |
|------|-----------|---------|---------|
| **拖拽部署** | 简单 | ❌ 每次手动拖 | 临时测试 |
| **GitHub + Netlify** | 中等 | ✅ 自动部署 | 正式使用 ✅ 推荐 |

---

## 方式一：拖拽部署（快速但不自动）

### 1.1 构建项目

1. 打开 **Windows PowerShell**（Win+X → Windows PowerShell(I)）

2. 进入项目目录：
   ```bash
   cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system
   ```

3. 构建项目：
   ```bash
   npm run build
   ```
   等待出现 `✓ built in xx s` 表示成功

4. 打开构建结果文件夹：
   ```bash
   start dist
   ```

### 1.2 上传到 Netlify

1. 打开 Netlify 网站并登录：https://app.netlify.com/drop

2. 将 `dist` 文件夹**拖拽**到页面的虚线框区域

3. 等待几秒，自动获得链接

### 1.3 后续更新

每次修改代码后：
1. 重新运行 `npm run build`
2. 重新拖拽 `dist` 文件夹到 Netlify

---

## 方式二：GitHub + Netlify（推荐，自动更新）⭐

> 推送到 GitHub 后，Netlify 自动检测并部署

### 第一步：安装 Git

1. 下载 Git：https://git-scm.com/download/win
2. 安装时一路下一步，**推荐勾选**：
   - ✅ "Git Bash Here"（右键菜单）
   - ✅ "Use MinTTY"
3. 验证安装：`git --version`

---

### 第二步：创建 GitHub 仓库

1. 打开 https://github.com 并登录
2. 点击右上角 **+** → **New repository**
3. 填写：
   - **Repository name**: `ketuo-write`
   - **Description**: `可拓写作智能系统（中学生）`
   - ❌ 不要勾选 "Initialize with README"
4. 点击 **Create repository**
5. 复制仓库地址（类似 `https://github.com/你的用户名/ketuo-write.git`）

---

### 第三步：初始化本地仓库并推送

#### 3.1 配置 Git 凭证管理器（重要！）

> ⚠️ **2021年后 GitHub 不再支持密码登录**，必须使用以下方式之一：

**方式 A：Git Credential Manager（推荐）✅ 已验证成功**

```bash
# 配置使用 Windows 凭据管理器
git config --global credential.helper manager
```

推送时会弹出浏览器窗口让你登录 GitHub，授权成功后会自动记住凭证。

**方式 B：在 URL 中嵌入 Token**

```bash
git remote set-url origin https://你的PersonalAccessToken@github.com/yishi-xiaoshi/ketuo-write.git
```

---

#### 3.2 完整推送步骤

1. 打开 **Windows PowerShell**

2. 进入项目目录：
   ```bash
   cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system
   ```

3. 初始化 Git 仓库：
   ```bash
   git init
   ```

4. 配置凭证管理器：
   ```bash
   git config --global credential.helper manager
   ```

5. 创建 `.gitignore` 文件（排除不需要的文件）：
   ```bash
   echo "node_modules/" > .gitignore
   echo "dist/" >> .gitignore
   echo ".env" >> .gitignore
   ```

6. 添加所有文件：
   ```bash
   git add .
   ```

7. 提交：
   ```bash
   git commit -m "Initial commit: 可拓写作智能系统"
   ```

8. 添加远程仓库：
   ```bash
   git remote add origin https://github.com/yishi-xiaoshi/ketuo-write.git
   ```

9. 推送到 GitHub：
   ```bash
   git push -u origin main
   ```

10. 首次推送时会弹出 Git Credential Manager 窗口，选择 **"Sign in with your browser"**

11. 浏览器中完成 GitHub 授权

12. 看到 `Authentication Succeeded` 和 `* [new branch] main -> main` 即表示成功！

---

### 第四步：常见错误处理

| 错误信息 | 解决方法 |
|---------|---------|
| `Password authentication is not supported` | 必须用 Token 或 Git Credential Manager |
| 看不到输入的密码/Token | 正常现象，PowerShell 隐藏输入以保护安全 |
| 浏览器授权后还是失败 | 确认授权了 `repo` 权限范围 |

---

### 第五步：连接 Netlify ✅ 已验证成功

#### 5.1 登录并创建项目

1. 打开 https://app.netlify.com 并登录（推荐用 GitHub 账号登录）
2. 点击 **Add new site** → **Import an existing project**
3. 选择 **GitHub**（首次会弹出授权窗口）

#### 5.2 授权 GitHub 仓库

4. 点击绿色的 **安装(Install)** 或 **授权(Authorize)** 按钮
5. 在弹出页面选择 `ketuo-write` 仓库
6. 点击 **安装(Install)**

#### 5.3 配置构建设置

7. 返回 Netlify 页面，确认配置：

| 设置项 | 值 | 说明 |
|--------|-----|------|
| **构建命令** | `npm run build` | ✅ 标准 Vite 项目 |
| **发布目录** | `dist` | ✅ Vite 默认输出目录 |
| **分支** | `main` | 部署哪个 GitHub 分支 |

8. 点击 **Deploy site** 开始部署

#### 5.4 等待部署完成

9. 页面显示 🟠 **Deploy in progress** 表示正在构建
10. 等待 1-3 分钟，状态变为 🟢 **Published** 表示成功
11. 获得网站地址：`https://ketuowrite-xxx.netlify.app`

#### 5.5 自定义网站名称（可选）

- Netlify 会根据仓库名自动生成网站名
- 可在 **Site settings** → **Site details** 中修改
- 最终格式：`https://你的名字.netlify.app`

---

### 第六步：完成！🎉

恭喜！你的网站已经上线！

#### 部署结果

| 项目 | 值 |
|------|-----|
| 网站地址 | `https://ketuowrite-xxx.netlify.app` |
| GitHub 仓库 | `https://github.com/yishi-xiaoshi/ketuo-write` |
| 自动部署 | ✅ 已开启（推送到 main 分支自动触发） |

#### 后续工作流

每次更新代码后：

```bash
# 1. 进入项目目录
cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system

# 2. 添加所有修改
git add .

# 3. 提交（写清楚改动）
git commit -m "修复了XX问题"

# 4. 推送到 GitHub（自动触发 Netlify 部署）
git push
```

推送到 GitHub 后，Netlify 会在 **1-3 分钟内**自动检测到更新并重新部署。

---

## 常用 Git 命令

```bash
# 进入项目目录
cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system

# 查看状态
git status

# 添加修改的文件
git add .

# 提交（写清楚做了什么修改）
git commit -m "修复了XX问题"

# 推送到 GitHub（自动触发 Netlify 部署）
git push
```

---

## 三、绑定自定义域名（可选）

如果需要使用自己的域名（如 `ketuo.com`），可以在 Netlify 中设置：

1. 登录 Netlify → 选择项目 → **Domain settings**

2. 点击 **Add custom domain**

3. 输入你的域名（如 `ketuo.com`）

4. 按照提示配置 DNS：
   - 添加 CNAME 记录指向 `resonant-horse-98ca6c.netlify.app`

5. 等待 DNS 生效后即可使用自定义域名

---

## 四、注意事项

### 4.1 数据存储
- 用户的题库数据保存在浏览器 localStorage 中
- 不同浏览器/设备的数据不共享
- 如需数据共享，需要开发后端服务

### 4.2 API 密钥
- 系统使用的硅基流动 API 密钥已内置在代码中
- API 有免费额度限制，超出后需要充值

### 4.3 构建失败排查
如果 `npm run build` 失败：
- 检查 Node.js 是否安装：`node --version`
- 检查 npm 是否安装：`npm --version`
- 重新安装依赖：`npm install`

---

## 五、快速命令汇总

```bash
# 进入项目目录
cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system

# 构建项目
npm run build

# 打开 dist 文件夹
start dist
```

---

## 六、联系与支持

- 网站：「可拓写作智能系统（中学生）」
- 技术支持：通过本 AI 助手咨询

---

*文档更新时间：2026-04-16（完成 GitHub + Netlify 完整部署流程验证）*
