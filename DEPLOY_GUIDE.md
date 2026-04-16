# 可拓写作智能系统部署指南

> 部署平台：Netlify（免费）
> 网站地址：https://resonant-horse-98ca6c.netlify.app

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

1. 打开 **Windows PowerShell**

2. 进入项目目录：
   ```bash
   cd c:/Users/penglishi/WorkBuddy/Claw/ketuo-write-system
   ```

3. 初始化 Git 仓库：
   ```bash
   git init
   ```

4. 创建 `.gitignore` 文件（排除不需要的文件）：
   ```bash
   echo "node_modules/" > .gitignore
   echo "dist/" >> .gitignore
   echo ".env" >> .gitignore
   ```

5. 添加所有文件：
   ```bash
   git add .
   ```

6. 提交：
   ```bash
   git commit -m "Initial commit: 可拓写作智能系统"
   ```

7. 添加远程仓库：
   ```bash
   git remote add origin https://github.com/你的用户名/ketuo-write.git
   ```
   ⚠️ 把 URL 换成你第二步复制的地址

8. 推送到 GitHub：
   ```bash
   git push -u origin main
   ```

   如果提示要用户名和密码：
   - 用户名：输入你的 GitHub 用户名
   - 密码：**需要用 Personal Access Token**（不是密码）

   获取 Token：
   1. GitHub → Settings → Developer settings → Personal access tokens → **Generate new token**
   2. 勾选 `repo` 权限
   3. 生成后复制 token，粘贴时当作密码使用

---

### 第四步：连接 Netlify

1. 打开 https://app.netlify.com 并登录
2. 点击 **Add new site** → **Import an existing project**
3. 选择 **GitHub**（首次需要授权 GitHub）
4. 选择你的仓库 `ketuo-write`
5. 配置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 点击 **Deploy site**

---

### 第五步：完成！🎉

Netlify 会自动构建并部署，之后：

| 操作 | 结果 |
|------|------|
| 推送代码到 GitHub | Netlify 自动检测并部署 |
| 打开网站 | https://xxx.netlify.app |
| 修改代码 | 推送到 GitHub 后自动更新 |

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

*文档更新时间：2026-04-16*
