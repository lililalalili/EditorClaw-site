# RAG 与语义搜索系统评估｜在线刷题与模拟考试系统

## 使用方法

1. 直接双击 `index.html`，即可在浏览器中离线使用。
2. 也可以把本文件夹上传到 GitHub Pages、Netlify、Vercel 或任意静态网站托管服务。
3. 学习进度和错题本保存在当前浏览器 localStorage 中，不会上传到服务器。

## 题库说明

- 总题数：120 题
- 模块数：12 个
- 题型：单选题、多选题
- 多选题正确答案数量：2–4 个
- 每题包含：题干、选项、正确答案、答案解析、模块、难度、标签

## 功能

- 模块筛选
- 题型/难度/关键词筛选
- 练习模式：即时判题与解析
- 模拟考试：倒计时、交卷后解析
- 错题本：自动记录错题
- 本地进度统计
- 导出题库、导出成绩、导出进度

## 推荐部署

### GitHub Pages

1. 新建 GitHub 仓库。
2. 上传 `index.html` 和 `question_bank.json`。
3. Settings → Pages → Deploy from branch → 选择 main/root。
4. 等待生成公开链接。

### 局域网使用

在该文件夹中运行：

```bash
python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000
```
