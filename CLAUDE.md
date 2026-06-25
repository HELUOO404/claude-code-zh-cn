# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 **Claude Code for VS Code 扩展的中文汉化工具**。通过 VS Code 扩展对 Claude Code 的 `webview/index.js` 文件进行字符串替换，将英文界面文本转换为中文。

该项目是一个 **VS Code 扩展**，安装后自动汉化 Claude Code 扩展的界面。

## 常用命令

### 开发相关命令

```bash
# 代码检查（ESLint）
pnpm run lint

# 运行测试（需要先通过 lint）
pnpm run test

# 开发模式构建（监听文件变化）
pnpm run dev

# 打包 VS Code 扩展
pnpm run build
```

## 高层架构

### 核心模块

- [lib/locator.js](lib/locator.js) - 扩展定位器，查找 Claude Code 的 `webview/index.js` 文件
- [lib/translator.js](lib/translator.js) - 翻译引擎，实现三阶段汉化（前置→内置→后置）
- [lib/backup.js](lib/backup.js) - 备份管理器，创建和还原 `.bak` 备份
- [lib/config.js](lib/config.js) - 配置管理器，读取用户自定义规则
- [translations/built-in.json](translations/built-in.json) - 内置翻译规则（376 条）

**重要说明**：
- Claude Code 的界面文本位于 `webview/index.js` 而非 `extension.js`
- 扩展会自动查找 `webview/index.js` 文件并应用汉化
- 支持用户通过配置添加前置和后置翻译规则

### 使用场景

**典型工作流程：**

1. 用户安装本 VS Code 扩展
2. 扩展自动定位 Claude Code 的 `webview/index.js`
3. 自动创建备份并应用汉化
4. 重启 VS Code 使变更生效

## 技术栈

- **Node.js** - 脚本运行环境
- **pnpm** - 包管理器
- **VS Code Extension API** - 类型定义（@types/vscode）

## 项目文件说明

| 文件 | 说明 |
|------|------|
| [extension.js](extension.js) | VS Code 扩展入口 |
| [package.json](package.json) | 项目配置和依赖定义 |
| [lib/](lib/) | 核心模块（locator、translator、backup、config） |
| [translations/built-in.json](translations/built-in.json) | 内置翻译规则 |
| [README.md](README.md) | 项目说明 |
| [CHANGELOG.md](CHANGELOG.md) | 版本更新日志 |

## 已知问题与限制

1. **侵入式修改**
   - 直接修改已安装的 Claude Code 扩展文件
   - Claude Code 更新时会覆盖汉化，需重新运行扩展

2. **局限性**
   - 纯字符串替换方式，无法处理动态生成的文本
   - 无法本地化 UI 布局、图标等非文本元素

## 开发注意事项

- 修改汉化规则时，编辑 [translations/built-in.json](translations/built-in.json) 中的翻译条目
- 每条规则包含 `original`（英文原文）和 `chinese`（中文翻译）
- 支持正则表达式：设置 `"regex": true` 和 `"flags": "g"`
- 更新前运行 `pnpm run lint` 检查代码质量
- 打包扩展前确保测试通过：`pnpm run test`

## 未来改进方向

1. 更新 README.md，移除过时内容
2. 考虑采用更规范的 i18n 框架
3. 实现 VS Code 扩展的完整激活逻辑（补充 extension.js）
