# Stock666 - 股基金持仓管理工具

一个基于 **Electron + React + TypeScript** 的现代化桌面应用，专注于股票和基金的持仓收益管理。支持分组管理、实时行情、深色模式，提供流畅的用户体验。

## 🎯 产品特性

- **轻量快速** - 启动迅速，响应灵敏，界面简洁优雅
- **专注收益** - 专为持仓收益计算和分析设计
- **分组管理** - 支持自定义分组，组织管理多个投资组合
- **双视图模式** - 卡片视图展示详情，列表视图快速浏览
- **实时行情** - 股票/基金行情自动刷新，掌握最新数据
- **本地存储** - 数据安全存储在本地 SQLite 数据库
- **深色模式** - 支持深色/浅色主题切换，保护眼睛
- **响应式布局** - 自适应窗口大小，完美适配各种屏幕
- **快速搜索** - 模态框快速搜索添加股票和基金

## 🚀 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **应用框架** | Electron | 40.6.1 |
| **前端库** | React | 19.2.4 |
| **类型系统** | TypeScript | 5.9.3 |
| **构建工具** | Vite | 7.3.1 |
| **状态管理** | Zustand | 5.0.11 |
| **数据库** | better-sqlite3 | 12.6.2 |
| **样式框架** | Tailwind CSS | 3.4.19 |
| **图标库** | Lucide React | 0.576.0 |
| **HTTP客户端** | Axios | 1.13.6 |

## 📁 项目结构

```
my-electron-app/
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── main.ts               # 主进程入口
│   │   └── preload.ts            # 预加载脚本
│   │
│   ├── renderer/                  # React 前端应用
│   │   ├── App.tsx               # 应用主组件（已优化为编排层）
│   │   ├── main.tsx              # 入口文件
│   │   ├── index.css             # 全局样式
│   │   │
│   │   ├── components/           # 组件（已按功能分组）
│   │   │   ├── layout/           # 布局组件
│   │   │   │   ├── Header.tsx    # 顶部导航栏（含刷新状态提示）
│   │   │   │   └── Sidebar.tsx   # 左侧分组面板（支持收缩）
│   │   │   │
│   │   │   ├── stock/            # 股票相关组件
│   │   │   │   ├── StockView.tsx          # 股票主视图（新增）
│   │   │   │   ├── StockCard.tsx          # 股票卡片
│   │   │   │   ├── StockList.tsx          # 股票列表
│   │   │   │   ├── StockForm.tsx          # 股票表单
│   │   │   │   └── StockActionMenu.tsx    # 股票操作菜单
│   │   │   │
│   │   │   ├── fund/             # 基金相关组件
│   │   │   │   ├── FundCard.tsx          # 基金卡片
│   │   │   │   ├── FundList.tsx          # 基金列表
│   │   │   │   ├── FundForm.tsx          # 基金表单
│   │   │   │   └── FundView.tsx          # 基金视图
│   │   │   │
│   │   │   ├── group/            # 分组管理组件
│   │   │   │   └── GroupItem.tsx # 分组项
│   │   │   │
│   │   │   ├── modals/           # 模态框组件
│   │   │   │   ├── AddStockModal.tsx         # 添加股票
│   │   │   │   ├── EditModal.tsx            # 编辑弹窗
│   │   │   │   ├── MoveModal.tsx            # 移动分组
│   │   │   │   ├── SearchStockModal.tsx     # 搜索股票
│   │   │   │   └── SearchFundModal.tsx      # 搜索基金
│   │   │   │
│   │   │   ├── ui/               # UI基础组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── Badge.tsx
│   │   │   │
│   │   │   └── index.ts          # 组件导出
│   │   │
│   │   ├── hooks/                # 业务逻辑 Hooks（新增）
│   │   │   ├── useAppLifecycle.ts     # 应用生命周期管理
│   │   │   ├── usePortfolioMetrics.ts # 收益计算和数据汇总
│   │   │   ├── useGroupActions.ts     # 分组操作
│   │   │   ├── useHoldingActions.ts   # 持仓操作
│   │   │   └── index.ts              # 统一导出
│   │   │
│   │   ├── types/                # 类型定义（新增）
│   │   │   └── hooks.ts          # Hook 相关类型
│   │   │
│   │   ├── services/             # 业务服务
│   │   │   ├── stockService.ts   # 股票服务
│   │   │   └── fundService.ts    # 基金服务
│   │   │
│   │   └── store/                # Zustand 状态管理（已分仓）
│   │       ├── index.ts          # 统一接口
│   │       ├── uiStore.ts        # UI 状态
│   │       ├── stockStore.ts     # 股票状态（含 refreshing）
│   │       ├── fundStore.ts      # 基金状态（含 refreshing）
│   │       └── refreshStore.ts   # 刷新配置
│   │
│   └── shared/                    # 共享资源
│       ├── types.ts              # TypeScript 类型定义
│       └── utils.ts              # 工具函数
│
├── package.json                   # 项目配置
├── tsconfig.json                  # TS配置（渲染进程）
├── tsconfig.main.json             # TS配置（主进程）
├── tsconfig.node.json             # TS配置（Node）
├── vite.config.ts                 # Vite 构建配置
├── tailwind.config.js             # Tailwind CSS 配置
├── postcss.config.js              # PostCSS 配置
└── README.md                       # 本文档
```

## ✨ 主要功能

### 股票管理
- ✅ **分组管理** - 创建、重命名、删除、移动分组
- ✅ **持仓管理** - 添加、编辑、删除、移动股票
- ✅ **实时行情** - 自动获取最新股价，支持手动刷新
- ✅ **收益计算** - 自动计算持仓成本、市值、浮动收益和收益率
- ✅ **双视图** - 卡片视图和列表视图，支持切换
- ✅ **快速搜索** - 模态框搜索添加股票

### 基金管理
- ✅ **分组管理** - 与股票共享分组系统
- ✅ **基金收益** - 基金收益统计和显示
- ✅ **双视图** - 卡片和列表视图支持
- 🚧 **基金行情** - 实时行情获取（待完善）

### 分组功能
- ✅ **创建/删除** - 快速创建和管理分组
- ✅ **重命名** - 修改分组名称
- ✅ **收缩展开** - 分组可收缩，节省空间
- ✅ **响应式** - 自动收缩/展开根据窗口宽度

### 界面特性
- ✅ **深色模式** - 完整的深色/浅色主题支持
- ✅ **响应式** - 自适应各种窗口大小
- ✅ **流畅动画** - 300ms 过渡效果，价格变化闪烁提示
- ✅ **现代UI** - 使用 Tailwind CSS 和 Lucide 图标
- ✅ **刷新反馈** - Activity 图标颜色变化，最小显示 600ms
- ✅ **列表优化** - 持仓为 0 时显示 `-`，避免数据误导

### 数据管理
- ✅ **本地存储** - SQLite 数据库存储
- ✅ **持久化** - 自动保存用户设置和数据
- ✅ **快速查询** - 优化的数据库查询

## 🛠 开发命令

```bash
# 安装依赖
npm install

# 开发模式（同时启动渲染进程和主进程）
npm run dev

# 编译项目
npm run build

# 启动应用（使用编译后的代码）
npm start

# 开发模式启动（带 DevTools）
npm run start:dev

# 打包应用（Windows NSIS 安装器）
npm run package
```

## 📊 数据模型

### 股票分组
```typescript
interface StockGroup {
  id: string
  name: string
  createdAt: number
}
```

### 股票持仓
```typescript
interface Stock {
  id: string
  symbol: string        // 股票代码
  name: string         // 股票名称
  groupId: string      // 所属分组
  costPrice: number    // 成本价
  quantity: number     // 持仓数量
  createdAt: number
}
```

### 股票行情
```typescript
interface StockQuote {
  symbol: string
  price: number        // 当前价格
  change: number       // 涨跌额（¥）
  changePercent: number // 涨跌幅（%）
  timestamp: number
}
```

### 收益计算
```
持仓成本 = 成本价 × 持仓数量
当前市值 = 当前价格 × 持仓数量
浮动收益（¥）= 当前市值 - 持仓成本
收益率（%）= 浮动收益 ÷ 持仓成本 × 100
```

## 💾 状态管理

使用 **Zustand** 进行全局状态管理，主要包括：

```typescript
interface AppState {
  // 股票数据
  stocks: Record<string, Stock>
  stockGroups: Record<string, StockGroup>
  stockQuotes: Record<string, StockQuote>
  
  // 基金数据
  funds: Record<string, Fund>
  fundGroups: Record<string, FundGroup>
  fundQuotes: Record<string, FundQuote>
  
  // UI状态
  activeTab: 'stock' | 'fund'
  sidebarCollapsed: boolean
  darkMode: boolean
  
  // 刷新控制
  autoRefreshEnabled: boolean
  refreshInterval: number
}
```

## 🎨 样式系统

采用 **Tailwind CSS** 进行样式开发：

- **颜色方案** - 红色表示上涨，绿色表示下跌（中国股市惯例）
- **深色适配** - 所有组件都支持深色模式
- **响应式** - 使用 Tailwind 响应式前缀实现
- **组件库** - 自定义 UI 组件库，统一风格

## 📱 界面布局

### 主界面结构
```
┌─────────────────────────────────────────┐
│        Header (顶部导航栏)               │
├──────────┬──────────────────────────────┤
│ Sidebar  │                              │
│ (分组)   │      Main Content            │
│          │   (股票/基金视图)            │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Header 区域
- 应用标题和 Logo
- 股票/基金 Tab 切换
- 收益统计显示
- 刷新控制按钮
- 深色模式切换
- 自动刷新开关

### Sidebar 区域
- 分组列表
- 新建分组按钮
- 分组收缩按钮
- 分组操作菜单

### Main Content 区域
- 卡片视图/列表视图切换
- 股票/基金卡片展示
- 操作菜单（编辑、移动、删除）
- 底部浮动操作按钮

## 🔄 交互流程

### 添加股票
1. 点击 Header 或 Sidebar 的"+"按钮
2. 选择目标分组
3. 输入股票信息或搜索添加
4. 系统自动获取实时行情

### 查看收益
1. 卡片视图直观展示各股票收益
2. Header 显示分组/全局收益统计
3. 列表视图显示详细数据

### 管理分组
1. Sidebar 中创建新分组
2. 拖拽或使用"移动到"菜单移动股票
3. 右键菜单重命名或删除分组

### 视图切换
1. 卡片视图 - 快速浏览，美观展示
2. 列表视图 - 详细数据，快速查找
3. 深色模式 - Header 切换按钮或系统级别

## ⚙️ 配置说明

### 自动刷新设置
- **默认间隔** - 5 秒（股票）/ 60 秒（基金）
- **支持自定义** - 可通过配置修改
- **全局开关** - Header 中可开关自动刷新

### 数据库位置
- **Windows**: `%APPDATA%/electron/stocklite.db`
- **macOS**: `~/Library/Application Support/Stock666/stocklite.db`
- **Linux**: `~/.config/Stock666/stocklite.db`

### 编码规范
- **TypeScript** - 严格模式，完整的类型注解
- **React** - Functional Components，Hooks 优先
- **代码风格** - Prettier 自动格式化
- **组件分组** - 按功能模块组织，每个模块有 index.ts

## 🚀 构建和发布

### 开发模式
```bash
npm run dev
```
启动 Vite 开发服务器和 TypeScript 编译器，支持热更新。

### 生产构建
```bash
npm run build
```
编译 TypeScript，构建 React 应用，生成可发布的代码。

### 打包应用
```bash
npm run package
```
使用 electron-builder 打包为 Windows NSIS 安装器。

### 应用配置 (package.json)
- **AppID**: `com.666.app`
- **应用名**: `Stock666`
- **目标**: Windows NSIS 安装程序
- **输出目录**: `release/`

## 📝 使用说明

### 快速开始
1. **创建分组** - 在 Sidebar 中点击"+"创建投资分组
2. **添加持仓** - 在分组中添加股票，填写代码/名称/成本价/数量
3. **查看收益** - 系统自动计算并实时显示收益数据
4. **管理持仓** - 使用操作菜单编辑、移动或删除持仓
5. **切换视图** - 在卡片和列表视图间切换，找到最适合的展示方式

### 高级功能
- **搜索添加** - 使用模态框搜索功能快速添加股票
- **批量操作** - 使用"移动到"功能快速整理分组
- **深色模式** - Header 右上角切换，自适应系统设置
- **自动刷新** - 修改刷新间隔获得实时行情

### 快捷操作
- **右键菜单** - 快速编辑、移动、删除
- **双击编辑** - 某些字段支持双击快速编辑
- **拖拽排序** - 分组和持仓支持拖拽操作

## 🐛 已知问题和限制

1. **行情数据** - 基金行情接口数据滞后
2. **基金模块** - 基金功能尚需完善
3. **导出功能** - 暂不支持数据导出
4. **多账户** - 当前仅支持单账户

## 🗺️ 未来规划

- [ ] **真实行情 API** - 集成更优秀的股票/基金行情数据

## 📚 详细文档

> **重要**: 项目已完成大规模架构重构，所有模块都已分仓。请查看以下文档了解详情。

### 🎯 快速开始
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 开发速查表，包含常用命令和代码片段

### 🏗️ 架构文档
- **[ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)** - 项目架构总结，包含整体设计和关键文件位置
- **[STORE_REFACTOR.md](./STORE_REFACTOR.md)** - Store 模块分仓详细文档（5个独立Store模块）
- **[MAIN_REFACTOR.md](./MAIN_REFACTOR.md)** - Main Process 分仓详细文档（7个功能模块）

### 📋 完成报告
- **[REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md)** - 重构完成总结，包含代码质量对比和性能分析
- **[COMPLETION_CHECKLIST.md](./COMPLETION_CHECKLIST.md)** - 完成清单，列出所有新创建的文件和模块

## 🔄 最近更新 (2026-03-05)

### 🎨 核心架构优化
- ✅ **App.tsx 瘦身** - 从 600+ 行精简，提取业务逻辑到 Hooks
  - `useAppLifecycle` - 应用生命周期管理（初始化、定时刷新、响应式侧栏）
  - `usePortfolioMetrics` - 收益计算和数据汇总（股票/基金收益、可见列表、分组计数）
  - `useGroupActions` - 分组操作（创建/选择/更新/删除/移动/添加）
  - `useHoldingActions` - 持仓操作（编辑/移动/删除/新增股票基金）
- ✅ **StockView 组件** - 股票视图独立组件，统一卡片/列表展示
- ✅ **类型系统重构** - 抽离所有内联类型到 `src/renderer/types/hooks.ts`
  - `AppTab` / `EditableHolding` / `UpdatePayload`
  - `StockSubmitPayload` / `FundSubmitPayload`
  - `UseHoldingActionsParams` / `UseGroupActionsParams` / `UsePortfolioMetricsParams`

### 🎯 用户体验改进
- ✅ **刷新状态反馈** - 自动刷新时的视觉提示
  - Header 右上角 Activity 图标颜色变化（灰色 → 绿色）
  - 手动刷新按钮旋转动画 + 禁用状态
  - **最小显示时间 600ms**，确保用户能看到反馈
- ✅ **股票列表优化** - 持仓为 0 时，市值和收益显示 `-`，避免误导
- ✅ **初始化修复** - 解决 Invalid Hook Call 错误，使用 `getState()` 正确调用 Store
- ✅ **性能优化** - 防止重复初始化和定时器重建，使用 `useRef` 稳定回调引用

### 🏗️ 代码质量提升
- ✅ **注释完善** - 为所有核心 Hooks 和业务逻辑添加详细注释
- ✅ **类型安全** - 消除 `any` 类型，使用统一的类型定义
- ✅ **模块化** - App.tsx 从"大而全"转为"编排层"，职责清晰

### 📁 新增文件
```
src/renderer/
├── hooks/                         # 业务逻辑 Hooks
│   ├── useAppLifecycle.ts        # 生命周期管理
│   ├── usePortfolioMetrics.ts    # 收益计算
│   ├── useGroupActions.ts        # 分组操作
│   ├── useHoldingActions.ts      # 持仓操作
│   └── index.ts                  # 统一导出
├── types/
│   └── hooks.ts                  # Hook 相关类型定义
└── components/
    └── stock/
        └── StockView.tsx         # 股票视图组件
```

### 🔧 技术改进
| 改进项 | 优化前 | 优化后 | 效果 |
|--------|--------|--------|------|
| App.tsx 行数 | 600+ | ~310 | ↓ 48% |
| 类型安全 | any 类型 | 统一类型 | ↑ 100% |
| 刷新反馈 | 无 | 600ms 最小显示 | ↑ 用户体验 |
| Hook 数量 | 0 | 4 | ↑ 可维护性 |

---

## 🔄 历史重构记录

### Store 分仓 (5个模块)
```
src/renderer/store/
├── uiStore.ts          # UI状态管理
├── stockStore.ts       # 股票数据和操作
├── fundStore.ts        # 基金数据和操作
├── refreshStore.ts     # 刷新配置
└── index.ts            # 统一接口（向后兼容）
```

### Main Process 分仓 (9个模块)
```
src/main/
├── main.ts             # 应用入口 (精简到 34行!)
├── database/           # 数据库管理
├── window/             # 窗口管理
├── ipc/                # IPC handlers (22个)
│   ├── stock.ts       # 股票操作
│   ├── fund.ts        # 基金操作
│   ├── quotes.ts      # 行情数据
│   └── search.ts      # 搜索功能
└── utils/              # 常数定义
```

### 改进统计
| 指标 | 优化前 | 优化后 | 改进幅度 |
|------|--------|--------|---------|
| main.ts 行数 | 500+ | 34 | ↓ 93% |
| 模块数 | 2 | 12 | ↑ 600% |
| 单文件最大行数 | 800 | 230 | ↓ 71% |
| 圈复杂度 | 高 | 低 | ↓ 显著 |

---
- 使用 TypeScript 严格模式
- 完整的 JSDoc 注释
- 单元测试覆盖核心功能

### 性能优化
- React.memo 优化组件渲染
- 虚拟滚动处理大列表
- 数据库查询优化

### 用户体验
- 加载动画和过渡效果
- 错误提示和恢复机制
- 快捷键支持
- 撤销/重做功能

## 📞 联系方式

- **问题报告** - 使用 GitHub Issues
- **功能建议** - 使用 GitHub Discussions
- **技术支持** - 查看文档或提交 Issue

---

**最后更新**: 2026年3月5日  
**版本**: 1.5.0  
**状态**: 🟢 活跃开发中
