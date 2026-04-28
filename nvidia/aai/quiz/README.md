# NCP-AAI 在线刷题与模拟考试系统

本系统基于 NCP-AAI Agentic AI Professional 中文讲义生成，包含 120 道题，覆盖 10 个章节。

## 文件说明

- `index.html`：单文件在线刷题/模拟考试系统，可直接双击打开。
- `question_bank.json`：题库源文件，便于后续扩展或导入其他系统。
- `metadata.json`：题库版本和章节信息。

## 功能

- 章节刷题：按章节、题型、难度、关键词筛选。
- 模拟考试：默认 60 题、120 分钟，可自定义题数与范围。
- 答案解析：刷题模式即时显示；考试模式交卷后显示。
- 错题本与收藏：保存在浏览器 localStorage。
- 学习统计：累计作答、正确率、章节掌握情况。
- 题库浏览：可搜索题干、解析和标签。
- 离线可用：不依赖任何外部 CDN 或服务器。

## 本地运行

直接双击 `index.html`，或运行：

```bash
cd NCP_AAI_Online_Quiz_System
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 新建 GitHub repository。
2. 上传本文件夹中的 `index.html`、`question_bank.json`、`metadata.json`。
3. Settings → Pages → Deploy from branch → 选择 main / root。
4. 使用 GitHub Pages URL 在线访问。

## 扩展题库

可按 `question_bank.json` 中的格式新增题目。若只使用 `index.html` 单文件，需要同步替换其中 `QUESTION_BANK` 变量。
