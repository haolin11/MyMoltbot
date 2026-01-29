# CasePilot 设计系统 v2.0

> 基于UI/UX Pro Max知识库，为B2B AI方案生成平台定制的专业设计系统

## 📋 产品定位

**产品类型**: B2B SaaS + AI/Chatbot Platform  
**目标用户**: AI交付方、系统集成商、技术决策者  
**核心价值**: 可追溯、可验收、可交付的工程级方案

## 🎨 设计风格

### 主风格：Professional Minimalism + Glassmorphism
- **Minimalism**: 清晰的层级、充足的留白、专注内容
- **Glassmorphism**: 现代感、轻量感、科技感
- **Soft UI Evolution**: 柔和深度、良好对比度、易用性

### 关键特征
✅ 专业、可信、技术感  
✅ 清晰的信息层级  
✅ 高可读性（WCAG AA+）  
✅ 现代但不过度装饰

## 🎨 配色系统

### 主色调（Primary）
```css
--color-primary: #2563EB;        /* Trust Blue - 主要交互 */
--color-primary-hover: #1D4ED8;  /* 悬停态 */
--color-primary-light: #DBEAFE;  /* 浅色背景 */
--color-primary-dark: #1E40AF;   /* 深色变体 */
```

### 辅助色（Secondary）
```css
--color-secondary: #7C3AED;      /* AI Purple - AI功能强调 */
--color-secondary-light: #EDE9FE;
--color-accent: #14B8A6;         /* Teal - 积极操作 */
```

### 语义色
```css
--color-success: #22C55E;        /* 成功、完成 */
--color-warning: #F59E0B;        /* 警告、验收 */
--color-error: #EF4444;          /* 错误、风险 */
--color-info: #06B6D4;           /* 信息提示 */
```

### 中性色
```css
--color-text-primary: #0B1220;   /* 主要文字 */
--color-text-secondary: #64748B; /* 次要文字 */
--color-text-tertiary: #94A3B8;  /* 辅助文字 */
--color-border: #E2E8F0;         /* 边框 */
--color-border-light: #F1F5F9;   /* 浅边框 */
--color-bg-primary: #FFFFFF;     /* 主背景 */
--color-bg-secondary: #F8FAFC;   /* 次背景 */
--color-bg-tertiary: #F1F5F9;    /* 三级背景 */
```

## 📝 字体系统

### 字体配对：Space Grotesk + Inter

```css
/* 标题字体 - Space Grotesk */
--font-heading: 'Space Grotesk', 'Noto Sans SC', sans-serif;
--font-heading-weights: 400, 500, 600, 700;

/* 正文字体 - Inter */
--font-body: 'Inter', 'Noto Sans SC', sans-serif;
--font-body-weights: 300, 400, 500, 600, 700;

/* 等宽字体 - JetBrains Mono */
--font-mono: 'JetBrains Mono', 'Consolas', monospace;
```

### 字体大小（Fluid Typography）
```css
--text-xs: 0.75rem;      /* 12px - 标签、辅助文字 */
--text-sm: 0.875rem;     /* 14px - 次要文字、导航 */
--text-base: 1rem;       /* 16px - 正文基础 */
--text-lg: 1.125rem;     /* 18px - 强调文字 */
--text-xl: 1.25rem;      /* 20px - 小标题 */
--text-2xl: 1.5rem;      /* 24px - 二级标题 */
--text-3xl: 1.875rem;    /* 30px - 一级标题 */
--text-4xl: 2.25rem;     /* 36px - 页面大标题 */
--text-5xl: 3rem;        /* 48px - Hero标题 */
```

### 字重规范
```
Heading:  600 (Semibold) - 常规标题
          700 (Bold) - 重要标题
Body:     400 (Regular) - 正文
          500 (Medium) - 强调
          600 (Semibold) - 次标题
```

## 📏 间距系统（8px Grid）

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px - 基础单位 */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## 🔘 组件规范

### Header（顶栏）- **统一规范**
```
高度: 64px (h-16) - 所有页面统一
背景: bg-white/90 + backdrop-blur-md
边框: border-b border-border
阴影: 无（使用边框分隔）
Logo尺寸: w-10 h-10 (40x40px) - 统一尺寸
Logo圆角: rounded-xl (12px)
Logo图标: text-base (16px) - 统一大小
品牌名字号: text-lg (18px) font-bold - 统一
副标题字号: text-xs (12px) text-secondary
导航字号: text-sm (14px) - 统一
导航间距: gap-1 (4px between items)
导航内边距: px-3 py-2
```

### Navigation（导航）- **统一样式**
```css
/* 普通状态 */
.nav-item {
  padding: 0.5rem 0.75rem;  /* py-2 px-3 */
  border-radius: 0.5rem;     /* rounded-lg */
  font-size: 0.875rem;       /* text-sm */
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

/* 悬停状态 */
.nav-item:hover {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

/* 激活状态 - 统一渐变背景 */
.nav-item-active {
  background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
  color: #FFFFFF;
  font-weight: 500;
}
```

### Buttons（按钮）
```css
/* 主按钮 */
.btn-primary {
  padding: 0.625rem 1.25rem;  /* py-2.5 px-5 */
  font-size: 0.875rem;         /* text-sm */
  font-weight: 500;
  border-radius: 0.75rem;      /* rounded-xl */
  background: linear-gradient(135deg, #2563EB, #7C3AED);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

/* 次按钮 */
.btn-secondary {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.75rem;
  background: white;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

/* 图标按钮间距 */
.btn-icon-gap {
  gap: 0.5rem;  /* 8px between icon and text */
}
```

### Cards（卡片）
```css
.card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 1rem;  /* 16px */
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  padding: 1.25rem;     /* 20px */
}

.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.10);
  border-color: rgba(37, 99, 235, 0.3);
  transform: translateY(-2px);
}
```

### 徽章/Pills
```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;  /* 4px 10px */
  font-size: 0.75rem;         /* 12px */
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.pill-primary {
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary-dark);
  border-color: rgba(37, 99, 235, 0.2);
}

.pill-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #92400E;
  border-color: rgba(245, 158, 11, 0.25);
}

.pill-success {
  background: rgba(34, 197, 94, 0.1);
  color: #065F46;
  border-color: rgba(34, 197, 94, 0.2);
}
```

## 📄 方案书专业排版规范

### 文档容器
```css
.document-container {
  max-width: 42rem;  /* 672px - 专业文档宽度 */
  margin: 0 auto;
  padding: 3rem 2rem;  /* 48px 32px */
  background: #FFFFFF;
  line-height: 1.75;
}
```

### 标题层级
```css
/* 一级标题 - 章节 */
h1.doc-title {
  font-size: 2rem;           /* 32px */
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

/* 二级标题 - 主要小节 */
h2.doc-heading {
  font-size: 1.5rem;         /* 24px */
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

/* 三级标题 - 次要小节 */
h3.doc-subheading {
  font-size: 1.25rem;        /* 20px */
  font-weight: 600;
  line-height: 1.4;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

/* 四级标题 - 要点 */
h4.doc-point {
  font-size: 1rem;           /* 16px */
  font-weight: 600;
  line-height: 1.5;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
```

### 正文段落
```css
.doc-paragraph {
  font-size: 1rem;           /* 16px */
  line-height: 1.75;         /* 28px */
  margin-bottom: 1.25rem;
  color: var(--color-text-primary);
}
```

### 列表样式
```css
.doc-list {
  margin: 1.5rem 0;
  padding-left: 1.5rem;
}

.doc-list-item {
  margin-bottom: 0.75rem;
  line-height: 1.75;
}

/* 有序列表编号 */
.doc-list-ordered {
  list-style-type: decimal;
}

/* 无序列表 */
.doc-list-unordered {
  list-style-type: disc;
}
```

### 专业表格
```css
.doc-table {
  width: 100%;
  margin: 2rem 0;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.doc-table thead {
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border);
}

.doc-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
}

.doc-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.doc-table tr:hover {
  background: var(--color-bg-tertiary);
}
```

### 引用块
```css
.doc-quote {
  margin: 2rem 0;
  padding: 1.5rem;
  border-left: 4px solid var(--color-primary);
  background: var(--color-bg-secondary);
  font-style: italic;
  border-radius: 0.5rem;
}
```

### 代码块
```css
.doc-code-inline {
  padding: 0.125rem 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.25rem;
  color: var(--color-text-primary);
}

.doc-code-block {
  margin: 1.5rem 0;
  padding: 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.7;
  background: #1E293B;
  color: #E2E8F0;
  border-radius: 0.75rem;
  overflow-x: auto;
}
```

### 注释/旁注
```css
.doc-note {
  margin: 1.5rem 0;
  padding: 1rem 1.25rem;
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 0.75rem;
  font-size: 0.9375rem;
}

.doc-note-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-primary);
}
```

## 🎯 图标规范

### 图标库：FontAwesome 6.x (Solid Style)
- **统一使用**: `fa-solid` 样式，避免混用`fa-regular`
- **使用方式**: `<i class="fa-solid fa-icon-name"></i>`
- **尺寸标准**:
  - Logo图标: text-base (16px) - **统一标准**
  - 导航图标: text-sm (14px)
  - 按钮图标: text-sm (14px)
  - 卡片图标: text-lg (18px)

### 常用图标映射（统一标准）
```
首页: fa-house
生成/AI: fa-wand-magic-sparkles
案例库: fa-layer-group
历史: fa-clock-rotate-left
用户: fa-user
设置: fa-gear
搜索: fa-magnifying-glass
下载: fa-download
上传: fa-upload
编辑: fa-pen-to-square
删除: fa-trash
关闭: fa-xmark
检查: fa-check
警告: fa-triangle-exclamation
信息: fa-circle-info
代码: fa-code
图表: fa-chart-line
文档: fa-file-lines
立方体/品牌: fa-cube
```

## 🔍 响应式断点

```css
/* Mobile First */
sm: 640px   /* 小型平板 */
md: 768px   /* 平板 */
lg: 1024px  /* 笔记本 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

## ✨ 动画与过渡

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-slower: 400ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### 标准过渡
```css
.transition-standard {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
}
```

## 🌐 Glassmorphism效果

```css
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 📊 数据可视化

### 图表配色
```css
--chart-primary: #2563EB;
--chart-secondary: #7C3AED;
--chart-success: #22C55E;
--chart-warning: #F59E0B;
--chart-error: #EF4444;
--chart-info: #06B6D4;
--chart-grey-1: #64748B;
--chart-grey-2: #94A3B8;
```

## ♿ 无障碍（Accessibility）

- **对比度**: 所有文字至少达到WCAG AA（4.5:1）
- **焦点状态**: 所有交互元素必须有明显的focus状态
- **语义化**: 使用正确的HTML语义标签
- **键盘导航**: 所有功能都可通过键盘访问

```css
/* Focus样式 */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## 📱 移动优先原则

1. 所有布局优先考虑移动端体验
2. 触摸目标最小44x44px
3. 文字最小16px（避免移动端缩放）
4. 横向滚动尽量避免

---

**版本**: v2.0  
**最后更新**: 2026-01-29  
**维护者**: CasePilot Design Team  
**基于**: UI/UX Pro Max Knowledge Base

## 🔧 快速修复清单

### 顶栏统一标准
- [ ] 所有页面顶栏高度统一为 `h-16` (64px)
- [ ] Logo尺寸统一为 `w-10 h-10` (40x40px)
- [ ] Logo图标大小统一为 `text-base` (16px)
- [ ] 品牌名统一为 `text-lg font-bold`
- [ ] 副标题统一为 `text-xs text-text-secondary`
- [ ] 导航项统一为 `text-sm px-3 py-2`

### 导航激活态统一
- [ ] 激活态背景使用渐变: `linear-gradient(135deg, #2563EB, #7C3AED)`
- [ ] 激活态文字: `text-white font-medium`
- [ ] 普通态悬停: `hover:text-primary hover:bg-bg-secondary`

### 图标统一
- [ ] 统一使用 `fa-solid` 风格
- [ ] Logo图标统一 `fa-cube`
- [ ] 按钮图标统一大小 `text-sm`

### 方案书排版
- [ ] 文档容器最大宽度 `max-w-[42rem]`
- [ ] 一级标题 `text-3xl font-bold mb-4`
- [ ] 二级标题 `text-2xl font-semibold mt-10 mb-4`
- [ ] 三级标题 `text-xl font-semibold mt-8 mb-3`
- [ ] 正文 `text-base leading-relaxed mb-5`
- [ ] 段落间距 `mb-5`
- [ ] 节与节之间 `mt-10`
