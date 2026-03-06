# StockLite - 股票基金全球市场持仓管理工具

一个基于 **Electron + React + TypeScript** 的现代化桌面应用，专注于股票、基金和全球市场指数的持仓收益管理。支持分组管理、实时行情、深色模式、拖拽排序、表头排序，提供流畅的用户体验。

## ⚡ 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式（推荐）
```bash
npm run dev
```
启动 Vite 开发服务器和 TypeScript 编译器，支持热更新。

### 生产模式启动
```bash
npm run build
npm run start
```

### 开发模式启动（带 DevTools）
```bash
npm run start:dev
```

### 打包安装程序（Windows）
```bash
npm run package
```
生成 Windows NSIS 安装器到 `release/` 目录。

## 🎯 核心特性

- **三大市场** - 股票、基金、全球市场指数一站式管理
- **轻量快速** - 启动迅速，响应灵敏，界面简洁优雅
- **专注收益** - 专为持仓收益计算和分析设计
- **智能分组** - 支持自定义分组，组织管理多个投资组合
- **双视图模式** - 卡片视图展示详情，列表视图快速浏览
- **拖拽排序** - 支持自由拖拽调整持仓顺序（无排序时）
- **表头排序** - 列表视图支持点击表头升序/降序排序
- **实时行情** - 股票/基金/全球指数行情自动刷新
- **市场时间智能** - 自动识别开/休市，智能控制刷新
- **本地存储** - 数据安全存储在本地 SQLite 数据库
- **深色模式** - 支持深色/浅色主题切换，保护眼睛
- **响应式布局** - 自适应窗口大小，侧栏自动收缩/展开
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
| **拖拽排序** | @dnd-kit/core | 6.3.1 |
| **拖拽排序** | @dnd-kit/sortable | 9.1.0 |

## 📁 项目结构

```
my-electron-app/
├── src/
│   ├── main/                      # Electron 主进程（已分仓）
│   │   ├── main.ts               # 主进程入口（34行）
│   │   ├── database/             # 数据库管理
│   │   │   └── index.ts          # SQLite 数据库操作
│   │   ├── window/               # 窗口管理
│   │   │   ├── index.ts          # 窗口创建和配置
│   │   │   └── preload.ts        # 预加载脚本
│   │   ├── ipc/                  # IPC handlers（22个）
│   │   │   ├── index.ts          # IPC 路由注册
│   │   │   ├── stock.ts          # 股票操作
│   │   │   ├── fund.ts           # 基金操作
│   │   │   ├── quotes.ts         # 行情数据
│   │   │   └── search.ts         # 搜索功能
│   │   └── utils/                # 工具和常量
│   │       ├── index.ts          # 工具函数
│   │       └── constants.ts      # 常量定义
│   │
│   ├── renderer/                  # React 前端应用
│   │   ├── App.tsx               # 应用主组件（编排层，310行）
│   │   ├── main.tsx              # 入口文件
│   │   ├── index.css             # 全局样式
│   │   │
│   │   ├── components/           # 组件（已按功能分组）
│   │   │   ├── layout/           # 布局组件
│   │   │   │   ├── Header.tsx    # 顶部导航栏（刷新状态、页面切换）
│   │   │   │   └── Sidebar.tsx   # 左侧分组面板（支持收缩）
│   │   │   │
│   │   │   ├── stock/            # 股票相关组件
│   │   │   │   ├── StockView.tsx          # 股票主视图
│   │   │   │   ├── StockCard.tsx          # 股票卡片
│   │   │   │   ├── StockList.tsx          # 股票列表（支持排序拖拽）
│   │   │   │   ├── StockForm.tsx          # 股票表单
│   │   │   │   ├── StockActionMenu.tsx    # 股票操作菜单
│   │   │   │   ├── DraggableStockCard.tsx # 可拖拽股票卡片
│   │   │   │   └── index.ts              # 导出
│   │   │   │
│   │   │   ├── fund/             # 基金相关组件
│   │   │   │   ├── FundView.tsx          # 基金主视图
│   │   │   │   ├── FundCard.tsx          # 基金卡片
│   │   │   │   ├── FundList.tsx          # 基金列表（支持排序拖拽）
│   │   │   │   ├── FundForm.tsx          # 基金表单
│   │   │   │   ├── FundActionMenu.tsx    # 基金操作菜单
│   │   │   │   ├── DraggableFundCard.tsx # 可拖拽基金卡片
│   │   │   │   └── index.ts              # 导出
│   │   │   │
│   │   │   ├── global/           # 全球市场组件（新增）
│   │   │   │   ├── GlobalMarketView.tsx  # 全球市场主视图
│   │   │   │   └── index.ts              # 导出
│   │   │   │
│   │   │   ├── group/            # 分组管理组件
│   │   │   │   ├── GroupItem.tsx # 分组项
│   │   │   │   └── index.ts      # 导出
│   │   │   │
│   │   │   ├── modals/           # 模态框组件
│   │   │   │   ├── AddStockModal.tsx         # 添加股票
│   │   │   │   ├── EditModal.tsx            # 编辑弹窗
│   │   │   │   ├── MoveModal.tsx            # 移动分组
│   │   │   │   ├── SearchStockModal.tsx     # 搜索股票
│   │   │   │   ├── SearchFundModal.tsx      # 搜索基金
│   │   │   │   └── index.ts                # 导出
│   │   │   │
│   │   │   ├── ui/               # UI基础组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   ├── Toggle.tsx
│   │   │   │   └── index.ts      # 导出
│   │   │   │
│   │   │   └── index.ts          # 组件总导出
│   │   │
│   │   ├── hooks/                # 业务逻辑 Hooks
│   │   │   ├── useAppLifecycle.ts     # 应用生命周期管理
│   │   │   ├── usePortfolioMetrics.ts # 收益计算和数据汇总
│   │   │   ├── useGroupActions.ts     # 分组操作
│   │   │   ├── useHoldingActions.ts   # 持仓操作
│   │   │   └── index.ts              # 统一导出
│   │   │
│   │   ├── types/                # 类型定义
│   │   │   └── hooks.ts          # Hook 相关类型
│   │   │
│   │   ├── services/             # 业务服务
│   │   │   ├── stockService.ts        # 股票服务
│   │   │   ├── fundService.ts         # 基金服务
│   │   │   └── globalMarketService.ts # 全球市场服务（新增）
│   │   │
│   │   └── store/                # Zustand 状态管理（已分仓）
│   │       ├── index.ts                # 统一接口（向后兼容）
│   │       ├── uiStore.ts              # UI 状态
│   │       ├── stockStore.ts           # 股票状态
│   │       ├── fundStore.ts            # 基金状态
│   │       ├── refreshStore.ts         # 刷新配置（市场时间）
│   │       └── globalMarketStore.ts    # 全球市场状态（新增）
│   │
│   └── shared/                    # 共享资源
│       ├── types.ts              # TypeScript 类型定义
│       ├── utils.ts              # 工具函数
│       └── marketTime.ts         # 市场时间工具（新增）
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

1. **全球市场数据** - 部分市场数据源待优化（日经225等）
2. **导出功能** - 暂不支持数据导出
3. **多账户** - 当前仅支持单账户

## 🗺️ 未来规划

- [ ] **优化全球市场数据源** - 改进日经225等市场的数据获取
- [ ] **数据导出功能** - 支持导出持仓和收益数据
- [ ] **多账户支持** - 支持管理多个投资账户
- [ ] **图表分析** - 添加收益趋势图表
- [ ] **性能监控** - 添加性能分析工具

## 📚 开发指南

### 2026-03-06 - 基金列表优化和全局市场完善
- ✅ **基金列表重构** - 统一使用 FundList 组件，支持排序和拖拽
  - 创建 `FundActionMenu` 组件，统一操作菜单
  - 添加涨跌幅列显示
  - 修复表头和内容列对齐问题
  - 支持拖拽排序和表头排序（升序/降序/无排序）
- ✅ **无限循环修复** - 解决基金页面的 "Maximum update depth exceeded" 错误
  - 使用单独的 store hooks（`useFundStore`, `useUIStore`）代替合并对象
  - 使用 `useMemo` 缓存 `filteredFunds` 和 `sortedFunds`
  - 打破无限渲染循环
- ✅ **刷新状态优化** - Header 刷新按钮根据当前页面显示对应的刷新状态
  - 股票页面显示股票刷新状态
  - 基金页面显示基金刷新状态
  - 全球市场页面显示全球市场刷新状态
  - 自动刷新开关仅在股票页面显示
- ✅ **全球市场数据源优化** - 重新规划全球市场数据获取
  - 美股（道指、纳指、标普500）- 新浪财经接口
  - 中国A股（上证、深证、沪深300）- 新浪财经接口
  - 港股（恒生指数）- 新浪财经实时接口
  - 日本（日经225）- 东方财富接口（备用）
  - 优化数据解析逻辑，正确处理不同接口格式

### 2026-03-05 - 核心架构优化
- ✅ **App.tsx 瘦身** - 从 600+ 行精简到 310 行，提取业务逻辑到 Hooks
  - `useAppLifecycle` - 应用生命周期管理（初始化、定时刷新、响应式侧栏）
  - `usePortfolioMetrics` - 收益计算和数据汇总（股票/基金收益、可见列表、分组计数）
  - `useGroupActions` - 分组操作（创建/选择/更新/删除/移动/添加）
  - `useHoldingActions` - 持仓操作（编辑/移动/删除/新增股票基金）
- ✅ **StockView 组件** - 股票视图独立组件，统一卡片/列表展示
- ✅ **类型系统重构** - 抽离所有内联类型到 `src/renderer/types/hooks.ts`
- ✅ **刷新状态反馈** - Activity 图标颜色变化（灰色 → 绿色），最小显示时间 600ms
- ✅ **股票列表优化** - 持仓为 0 时，市值和收益显示 `-`，避免误导
- ✅ **初始化修复** - 解决 Invalid Hook Call 错误

### 2026-03-04 - Store 和 Main Process 分仓
- ✅ **Store 模块分仓** - 拆分为 5 个独立模块
  - `uiStore.ts` - UI 状态管理
  - `stockStore.ts` - 股票数据和操作
  - `fundStore.ts` - 基金数据和操作
  - `refreshStore.ts` - 刷新配置和市场时间
  - `globalMarketStore.ts` - 全球市场状态
- ✅ **Main Process 分仓** - 拆分为 9 个功能模块
  - `database/` - 数据库管理
  - `window/` - 窗口管理
  - `ipc/` - IPC handlers（22个）
  - `utils/` - 工具和常量
- ✅ **main.ts 精简** - 从 500+ 行精简到 34 行
- ✅ **代码质量提升** - 完整的 JSDoc 注释，类型安全

### 主要改进统计
| 指标 | 优化前 | 优化后 | 改进幅度 |
|------|--------|--------|---------|
| App.tsx 行数 | 600+ | 310 | ↓ 48% |
| main.ts 行数 | 500+ | 34 | ↓ 93% |
| Store 模块数 | 1 | 5 | ↑ 400% |
| Main 模块数 | 2 | 9 | ↑ 350% |
| 类型安全 | any 类型 | 统一类型 | ↑ 100% |

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

**最后更新**: 2026年3月6日  
**版本**: 1.5.0  
**状态**: 🟢 活跃开发中

**主要功能完成度**:
- ✅ 股票管理 - 100%
- ✅ 基金管理 - 100%
- ✅ 全球市场 - 95%（部分市场数据源待优化）
- ✅ 拖拽排序 - 100%
- ✅ 表头排序 - 100%
- ✅ 智能刷新 - 100%
- ✅ 响应式布局 - 100%


