# StockLite UI 组件库

基于 Tailwind CSS 的轻量级 UI 组件库，专为 StockLite 应用设计。

## 📦 已提供的组件

### Button 按钮

最常用的交互组件，支持多种变体和尺寸。

```tsx
import { Button } from '@/renderer/ui'

// 主要按钮
<Button variant="primary" onClick={handleClick}>
  确定
</Button>

// 带图标的按钮
<Button 
  variant="success" 
  leftIcon={<Plus size={16} />}
  onClick={handleAdd}
>
  添加
</Button>

// 加载状态
<Button 
  variant="primary" 
  isLoading={isSubmitting}
  onClick={handleSubmit}
>
  提交
</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
```

**Props:**
- `variant`: 按钮样式变体 (`primary` | `secondary` | `success` | `danger` | `ghost`)
- `size`: 按钮尺寸 (`sm` | `md` | `lg`)
- `isLoading`: 是否显示加载状态
- `leftIcon`: 左侧图标
- `rightIcon`: 右侧图标

---

### Input 输入框

表单输入组件，支持标签、错误提示和前后缀元素。

```tsx
import { Input } from '@/renderer/ui'

// 基础用法
<Input 
  label="股票代码" 
  placeholder="如：000001"
  value={code}
  onChange={(e) => setCode(e.target.value)}
/>

// 带错误提示
<Input
  label="股票名称"
  error="请输入有效的股票名称"
  darkMode={darkMode}
/>

// 带前缀图标
<Input
  label="搜索"
  leftElement={<Search size={16} />}
  placeholder="搜索股票..."
/>
```

**Props:**
- `label`: 输入框标签
- `error`: 错误信息
- `leftElement`: 左侧自定义元素（如图标）
- `rightElement`: 右侧自定义元素
- `darkMode`: 是否使用深色模式

---

### Card 卡片容器

通用的毛玻璃效果卡片容器。

```tsx
import { Card } from '@/renderer/ui'

// 基础卡片
<Card darkMode={darkMode}>
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</Card>

// 可悬停的卡片
<Card 
  darkMode={darkMode}
  hoverable
  onClick={handleClick}
>
  可点击的卡片
</Card>
```

**Props:**
- `darkMode`: 是否使用深色模式
- `hoverable`: 是否可悬停（显示阴影效果）
- `onClick`: 点击事件

---

### Badge 徽章

用于状态标记的小标签。

```tsx
import { Badge } from '@/renderer/ui'

// 不同变体
<Badge variant="success">收益</Badge>
<Badge variant="danger">亏损</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="info">信息</Badge>
<Badge variant="default">默认</Badge>

// 不同尺寸
<Badge size="sm">小徽章</Badge>
<Badge size="md">中徽章</Badge>
```

**Props:**
- `variant`: 徽章变体 (`default` | `success` | `danger` | `warning` | `info`)
- `size`: 徽章尺寸 (`sm` | `md`)

---

### Toggle 开关切换

布尔值切换组件。

```tsx
import { Toggle } from '@/renderer/ui'

// 基础用法
<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="自动刷新"
  darkMode={darkMode}
/>

// 禁用状态
<Toggle
  checked={false}
  disabled
  label="不可用"
/>

// 不同尺寸
<Toggle size="sm" checked={smallToggle} onChange={setSmallToggle} />
<Toggle size="md" checked={mediumToggle} onChange={setMediumToggle} />
```

**Props:**
- `checked`: 是否选中
- `onChange`: 状态变化回调
- `disabled`: 是否禁用
- `size`: 开关尺寸 (`sm` | `md`)
- `label`: 开关标签
- `darkMode`: 是否使用深色模式

---

### Tabs 标签页切换

分段控制器，用于切换不同的视图。

```tsx
import { Tabs } from '@/renderer/ui'
import { TrendingUp, PieChart } from 'lucide-react'

<Tabs
  activeTab={activeTab}
  onChange={setActiveTab}
  tabs={[
    { id: 'stock', label: '股票', icon: <TrendingUp /> },
    { id: 'fund', label: '基金', icon: <PieChart /> }
  ]}
  size="md"
/>
```

**Props:**
- `activeTab`: 当前激活的 tab ID
- `onChange`: tab 变化回调
- `tabs`: tab 配置数组
- `size`: tab 尺寸 (`sm` | `md`)

---

## 🎨 设计规范

### 颜色系统

所有组件都遵循统一的颜色规范：

- **Primary**: 蓝色渐变 (`from-blue-500 to-indigo-600`)
- **Success**: 绿色渐变 (`from-green-500 to-emerald-600`)
- **Danger**: 红色 (`red-500`)
- **Warning**: 黄色 (`yellow-500`)
- **Info**: 蓝色 (`blue-500`)

### 深色模式

所有组件都支持深色模式，通过 `darkMode` prop 控制。

### 响应式

组件都使用了相对单位，适配各种屏幕尺寸。

---

## 📝 使用建议

1. **统一导入**: 从 `@/renderer/ui` 统一导入组件
2. **类型安全**: 所有组件都提供了 TypeScript 类型定义
3. **主题一致**: 使用 `darkMode` prop 保持主题一致性
4. **组合使用**: 可以灵活组合多个组件创建复杂 UI

---

## 🔧 扩展组件

如需添加新组件，请遵循以下规范：

1. 在 `src/renderer/ui` 目录创建 `.tsx` 文件
2. 导出组件和对应的 Props 类型
3. 在 `index.ts` 中添加导出
4. 确保支持深色模式
5. 提供完整的 TypeScript 类型定义

示例：
```tsx
// Select.tsx
interface SelectProps {
  // ... props
}

export type { SelectProps }

export const Select: React.FC<SelectProps> = (props) => {
  // ... implementation
}
```
