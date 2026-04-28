# 为大语言模型添加知识：题库与在线刷题/模拟考试系统

## 内容

- `index.html`：单文件在线刷题与模拟考试系统，双击即可在浏览器打开；也可上传到 GitHub Pages、Nginx、内网服务器使用。
- `question_bank.json`：结构化题库数据，包含题干、选项、答案、解析、模块、难度、知识点标签。
- `question_bank.csv`：可用 Excel 打开的题库表。

## 题库规模

- 总题数：64
- 单选题：32
- 多选题：32
- 模块数：8
- 覆盖要求：重要知识点至少覆盖 2 次。

## 使用方法

1. 解压压缩包。
2. 双击 `index.html` 打开。
3. 在“刷题模式”中按模块/题型/难度练习。
4. 在“模拟考试”中设置题数和时间后开始考试。
5. 错题会自动保存在浏览器本地，不会上传到服务器。

## 部署到 GitHub Pages

1. 新建一个 GitHub repository。
2. 上传 `index.html`、`question_bank.json`、`question_bank.csv`。
3. 在 Settings → Pages 中选择 main branch / root。
4. 等待 GitHub Pages 发布后，即可在线访问。

## 备注

题库基于上传课程大纲和前序课程讲义整理，重点覆盖 NeMo Curator、数据清洗/过滤/PII、合成问答数据、MMLU、LLM-as-a-Judge、NeMo Evaluator、MLflow、CPT、SFT、DPO、NeMo-RL、TensorRT-LLM、PTQ/FP8、Depth Pruning、知识蒸馏和最终实践评估。
