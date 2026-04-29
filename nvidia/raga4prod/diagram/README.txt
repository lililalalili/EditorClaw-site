免责声明

本资料为个人/教学用途整理的非官方学习资料，基于公开资料、通用工程知识和作者原创扩展编写。本资料不是 NVIDIA 官方资料，也未获得 NVIDIA 官方授权或背书；不包含 NVIDIA DLI 课程内部课件、视频、实验环境、测验题或官方教材内容。NVIDIA、NVIDIA NIM、NeMo、DLI、RAG Blueprint 等名称可能是 NVIDIA Corporation 的商标或注册商标，本文仅用于技术说明和学习引用。请以 NVIDIA 官方课程、文档和许可条款为准。

发布建议

1. 不要使用 NVIDIA 或 DLI logo。
2. 不要声称“官方授权”“官方教材”“官方题库”“真题”。
3. 若公开发布，建议标题使用“生产级 RAG Pipeline 部署学习指南/学习平台/原创练习题库”。
4. 若商业销售或大规模分发，建议另行进行法律审核或取得权利方授权。

---

# RAG Production Diagram Suite

本图解包包含 9 张生产级 RAG Pipeline 架构图与流程图：

1. RAG 离线 ingestion pipeline 图
2. RAG 在线 query pipeline 图
3. Kubernetes 部署拓扑图
4. NIM 微服务调用关系图
5. Helm 部署流程图
6. 监控与日志架构图
7. RAG 质量评估闭环图
8. 安全权限控制链路图
9. 故障排查流程图

## 文件夹说明

- svg/：矢量图，适合插入 Word、PPT、网页并保持高清。
- png/：位图，适合直接插入 PPT、公众号、文档。
- mermaid/：Mermaid 源文件，适合继续编辑流程图。
- index.html：图集浏览页，可直接双击打开。

## 使用建议

- 教材/Word：优先插入 SVG。
- PowerPoint：SVG 或 PNG 均可；若需要编辑元素，建议使用 SVG。
- 网页/课程平台：可直接引用 svg/ 下的文件。
- WeChat 推文：建议使用 png/ 下的文件。
