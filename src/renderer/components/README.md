# Components 目录结构

本目录按功能模块组织组件，提高代码可维护性和可读性。

## 目录结构

```
components/
├── layout/          # 布局组件
│   ├── Header.tsx           - 顶部导航栏
│   ├── Sidebar.tsx          - 侧边栏（分组管理）
│   └── index.ts
│
├── stock/           # 股票相关组件
│   ├── StockCard.tsx        - 股票卡片（卡片视图）
│   ├── StockList.tsx        - 股票列表（列表视图）
│   ├── StockForm.tsx        - 股票表单（添加/编辑）
│   ├── StockActionMenu.tsx  - 股票操作菜单（复用组件）
│   └── index.ts
│
├── fund/            # 基金相关组件
│   ├── FundCard.tsx         - 基金卡片（卡片视图）
│   ├── FundList.tsx         - 基金列表（列表视图）
│   ├── FundForm.tsx         - 基金表单（添加/编辑）
│   ├── FundView.tsx         - 基金视图容器
│   └── index.ts
│
├── group/           # 分组相关组件
│   ├── GroupItem.tsx        - 分组项（侧边栏中的分组项）
│   └── index.ts
│
├── modals/          # 模态框组件
│   ├── AddStockModal.tsx    - 添加股票模态框
│   ├── EditModal.tsx        - 编辑模态框（通用）
│   ├── MoveModal.tsx        - 移动到分组模态框（复用）
│   ├── SearchStockModal.tsx - 搜索股票模态框
│   ├── SearchFundModal.tsx  - 搜索基金模态框
│   └── index.ts
│
├── ui/              # UI基础组件（未变动）
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Tabs.tsx
│   └── ...
│
└── index.ts         # 统一导出入口
```

## 模块说明

### layout 布局模块
包含应用的主要布局组件，如顶部导航栏和侧边栏。

### stock 股票模块
所有与股票相关的组件，包括显示、添加、编辑等功能。

### fund 基金模块
所有与基金相关的组件，包括显示、添加、编辑等功能。

### group 分组模块
分组管理相关组件。

### modals 模态框模块
所有模态框组件，提供弹窗交互功能。

## 导入方式

### 从统一入口导入（推荐）
```typescript
import { Header, Sidebar, StockCard, FundView } from '@/components'
```

### 从子模块导入
```typescript
import { StockCard, StockList } from '@/components/stock'
import { FundCard, FundView } from '@/components/fund'
import { MoveModal, EditModal } from '@/components/modals'
```

### 直接导入
```typescript
import { StockCard } from '@/components/stock/StockCard'
```

## 优势

1. **清晰的模块划分**: 按功能分组，一目了然
2. **易于维护**: 相关组件放在一起，修改更方便
3. **减少冲突**: 团队协作时减少文件冲突
4. **更好的导入**: 支持模块级导入，减少导入路径长度
5. **可扩展性**: 新增功能时可以轻松添加新模块

## 注意事项

- 组件内部导入需要使用相对路径
- shared/types 的导入路径为 `../../../shared/types`
- ui 组件的导入路径根据当前位置调整
- 模块内组件可以使用 `./` 相对导入

## 重构历史

**日期**: 2026-03-04
**原因**: 组件过多导致目录混乱，不易维护
**改进**: 按功能模块重新组织，提升代码质量

