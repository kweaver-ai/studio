# Studio

[中文](README.zh.md) | [English](README.md)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE.txt)

Studio 是 KWeaver 生态的一部分。如果您喜欢这个项目，欢迎也给 **[KWeaver](https://github.com/kweaver-ai/kweaver)** 项目点个 ⭐！

**[KWeaver](https://github.com/kweaver-ai/kweaver)** 是一个构建、发布、运行决策智能型 AI 应用的开源生态。此生态采用本体作为业务知识网络的核心方法，以 DIP 为核心平台，旨在提供弹性、敏捷、可靠的企业级决策智能，进一步释放每一员的生产力。

DIP 平台包括 ADP、Decision Agent、DIP Studio、AI Store 等关键子系统。

## 📚 快速链接

- 🤝 [贡献指南](CONTRIBUTING.zh.md) - 项目贡献指南
- 📄 [许可证](LICENSE.txt) - Apache License 2.0
- 🐛 [报告 Bug](https://github.com/kweaver-ai/studio) - 报告问题或 Bug
- 💡 [功能建议](https://github.com/kweaver-ai/studio) - 提出新功能建议

## Studio 定义

Studio 是一个企业级的一站式系统工作台，集成了统一身份认证、细粒度的权限控制、大模型资源管理及一些系统公共服务能力。

旨在为开发者和管理员提供一个安全、高效、可视化的控制中心和工作中心，帮助企业快速构建安全底座并管理 AI 模型资产。

---

## ✨ 核心功能

Studio 围绕三大核心模块构建：

### 🔐 1. 信息安全编织（Identify and Authentication）

提供完善的身份治理与访问控制能力：

- **统一身份认证**：支持本地账户管理及多源身份集成。
- **RBAC 权限体系**：基于“用户-角色-权限”的模型，支持灵活的角色管理与访问策略配置。
- **组织架构**：支持多层级的部门管理与用户组划分。
- **日志与审计**：全链路记录操作日志与安全审计日志，确保合规性。

### 🤖 2. 模型（Model）

针对 AI 时代的模型资源管理与调度：

- **提示词工程（Prompt Engineering）**：可视化的提示词编写、测试。
- **配额管理**：对不同租户或应用的 Token 使用量及调用次数进行限额控制。
- **模型管理**：支持接入大模型、小模型，并设置全局默认模型。
- **模型统计**：实时监控模型调用数据，生成可视化报表。

### 🛠 3. 公共服务（Common Services）

系统级的基础设施服务：

- **业务域管理**：支持按照业务域管理 DataAgent、DataFlow、Ontology、Operator。
- **消息通知**：邮件服务配置及第三方消息插件（如钉钉、企业微信等）。

---

## 🚀 快速开始

1. Fork 代码库
2. 创建特性分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 创建 Pull Request

## 许可证

本项目采用 Apache License 2.0 许可证。详情请参阅 [LICENSE](LICENSE.txt) 文件。

## 支持与联系

- **问题反馈**: [GitHub Issues](https://github.com/kweaver-ai/studio)
- **许可证**: [Apache License 2.0](LICENSE.txt)

---

后续更多组件开源，敬请期待！

---

## 📄 开源协议

本项目基于 [Apache License 2.0](LICENSE) 协议开源。