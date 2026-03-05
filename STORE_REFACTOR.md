# Store 分仓文档

## 概述
原本的 Store 是一个单体结构，包含了 UI 状态、股票数据、基金数据、刷新配置等所有状态管理。为了提高代码可维护性和可读性，我们将其分解为多个功能模块化的 Store。

## 新的 Store 架构

### 目录结构
```
src/renderer/store/
├── index.ts           # 根Store（合并所有子Store，提供统一接口）
├── uiStore.ts         # UI状态管理
├── stockStore.ts      # 股票相关状态管理
├── fundStore.ts       # 基金相关状态管理
└── refreshStore.ts    # 刷新配置管理
```

## 各Store详细说明

### 1. uiStore.ts - UI 状态管理
**职责：** 管理应用的UI相关状态

**状态：**
- `activeTab`: 当前活跃标签页 ('stock' | 'fund')
- `darkMode`: 暗黑模式开关
- `stockViewMode`: 股票列表视图模式 ('card' | 'list')
- `fundViewMode`: 基金列表视图模式 ('card' | 'list')
- `sidebarCollapsed`: 侧边栏折叠状态

**方法：**
- `setActiveTab(tab)`: 切换标签页
- `toggleDarkMode()`: 切换暗黑模式
- `setStockViewMode(mode)`: 设置股票视图模式
- `setFundViewMode(mode)`: 设置基金视图模式
- `toggleSidebar()`: 切换侧边栏
- `setSidebarCollapsed(collapsed)`: 设置侧边栏状态

**持久化：** 所有UI状态通过 localStorage 持久化

---

### 2. stockStore.ts - 股票状态管理
**职责：** 管理股票相关的所有状态和操作

**状态：**
- `stockGroups`: 股票分组列表
- `stocks`: 股票持仓列表
- `stockQuotes`: 股票行情数据（以symbol为key）
- `selectedStockGroup`: 当前选中的股票分组ID

**分组操作：**
- `createStockGroup(name)`: 创建新分组
- `selectStockGroup(groupId)`: 选择分组
- `updateStockGroup(id, name)`: 更新分组名称
- `deleteStockGroup(id)`: 删除分组及其下所有股票

**股票操作：**
- `addStock(stock)`: 添加新股票
- `updateStock(id, updates)`: 更新股票信息
- `deleteStock(id)`: 删除股票
- `moveStockToGroup(stockId, newGroupId)`: 将股票移到其他分组

**数据操作：**
- `refreshStockQuotes()`: 刷新股票行情数据
- `initialize()`: 初始化（加载数据库数据）

---

### 3. fundStore.ts - 基金状态管理
**职责：** 管理基金相关的所有状态和操作

**状态：**
- `fundGroups`: 基金分组列表
- `funds`: 基金持仓列表
- `fundQuotes`: 基金行情数据（以code为key）
- `selectedFundGroup`: 当前选中的基金分组ID

**分组操作：**
- `createFundGroup(name)`: 创建新分组
- `selectFundGroup(groupId)`: 选择分组
- `updateFundGroup(id, name)`: 更新分组名称
- `deleteFundGroup(id)`: 删除分组及其下所有基金

**基金操作：**
- `addFund(fund)`: 添加新基金
- `updateFund(id, updates)`: 更新基金信息
- `deleteFund(id)`: 删除基金
- `moveFundToGroup(fundId, newGroupId)`: 将基金移到其他分组

**数据操作：**
- `refreshFundQuotes()`: 刷新基金行情数据
- `initialize()`: 初始化（加载数据库数据）

---

### 4. refreshStore.ts - 刷新配置管理
**职责：** 管理数据刷新相关的配置

**状态：**
- `refreshConfig`: 刷新配置对象
  - `stockInterval`: 股票刷新间隔（毫秒）
  - `fundInterval`: 基金刷新间隔（毫秒）
  - `enabled`: 是否启用自动刷新

**方法：**
- `setRefreshConfig(config)`: 设置刷新配置
- `toggleRefresh(enabled)`: 启用/禁用自动刷新
- `initialize()`: 初始化（从localStorage加载配置）

**持久化：** 刷新配置通过 localStorage 持久化

---

### 5. index.ts - 根Store（统一接口）
**职责：** 合并所有子Store，提供统一的useStore接口

**特点：**
- 提供向后兼容性，现有代码无需修改就能使用
- `useStore()` 函数返回包含所有子Store功能的合并对象
- 统一的 `initialize()` 方法会调用所有子Store的初始化

**导出：**
- `useStore()`: 合并后的Store hook（推荐用于组件）
- `useUIStore`: UI Store hook（可单独使用）
- `useStockStore`: 股票Store hook（可单独使用）
- `useFundStore`: 基金Store hook（可单独使用）
- `useRefreshStore`: 刷新配置Store hook（可单独使用）

---

## 使用示例

### 在组件中使用（推荐方式）
```typescript
// 使用合并后的useStore hook
const { 
  stocks, 
  stockGroups, 
  addStock, 
  deleteStock 
} = useStore()

// 或者单独使用子Store（如果只需要某个模块）
const { stocks, addStock } = useStockStore()
const { darkMode, toggleDarkMode } = useUIStore()
```

### 在初始化时使用
```typescript
useEffect(() => {
  // 初始化所有Store
  await useRefreshStore.getState().initialize()
  await useStockStore.getState().initialize()
  await useFundStore.getState().initialize()
}, [])
```

---

## 迁移指南（如果有现有代码）

### 旧方式 → 新方式

**旧：**
```typescript
import { useStore } from './store'

const store = useStore()
// store.initialize() 返回 Promise
```

**新：**
```typescript
import { useStockStore, useFundStore, useRefreshStore } from './store'

// 在useEffect中初始化各个Store
useEffect(() => {
  useStockStore.getState().initialize()
  useFundStore.getState().initialize()
  useRefreshStore.getState().initialize()
}, [])
```

---

## 优势

1. **模块清晰**：每个Store负责单一职责，易于理解和维护
2. **代码重用**：可以独立导入和使用某个Store
3. **性能优化**：组件可以只订阅需要的Store，减少不必要的重新渲染
4. **可扩展性**：添加新功能时，可以轻松创建新的Store模块
5. **测试友好**：每个Store可以独立测试
6. **类型安全**：各Store有明确的类型定义

---

## 后续优化建议

1. **Extract state selectors**: 创建选择器函数来避免全局状态的深度复制
2. **Add immer middleware**: 使用Zustand的immer中间件简化状态更新
3. **Add persist middleware**: 使用zustand-persist来更好地管理localStorage
4. **Create custom hooks**: 创建自定义hooks来抽象常见的Store操作组合


