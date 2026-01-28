---
name: ui-ux-pro-max
description: UI/UX 设计情报与可搜索设计数据库（样式/配色/排版/落地页结构/UX 规范/图表/技术栈指南）。当需要做界面设计方案、生成设计系统、挑选配色与字体、审查与改进 UI/UX、给出可落地的前端实现建议时使用；通过 Python CLI 查询并输出推荐。
---

# ui-ux-pro-max

用本 skill 在“要做得更像设计师而不是随便写 UI”的时候快速产出可执行的设计系统与实现建议。

## 快速用法（Codex）

脚本位置：
- `skills/ui-ux-pro-max/scripts/search.py`

先确认 Python：
```bash
python3 --version || python --version
```

### 1) 生成完整 Design System（优先用这个）

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<产品/行业/关键词>" --design-system -f markdown -p "<项目名>"
```

可选：把设计系统落盘（便于后续页面级覆盖）：
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -f markdown -p "<项目名>" \
  --output-dir "<输出目录>" \
  [--page "<page>"]
```

### 2) 按领域搜索（需要补充细节时）

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --domain <domain> -n 3
```

常用 domain：
- `product`（产品类型）
- `style`（UI 风格）
- `color`（配色方案）
- `typography`（字体搭配）
- `landing`（落地页结构/转化）
- `ux`（UX 规范与反例）
- `chart`（图表类型/可视化建议）
- `web`（Web 交互与可访问性要点）
- `react`（React 性能/交互要点）

### 3) 按技术栈查询落地建议

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --stack <stack>
```

可用 stack（示例）：`html-tailwind`（默认思路）、`react`、`nextjs`、`vue`、`svelte`、`shadcn`、`flutter`、`react-native`、`swiftui`、`jetpack-compose` 等。

## 工作流建议

1. 先跑 `--design-system` 得到：Pattern + Style + Colors + Typography + 注意事项/反模式
2. 再按需用 `--domain` / `--stack` 把“组件/交互/可访问性/性能/图表”细化
3. 把结果转成项目里的设计 token / Tailwind 变量 / 组件规范，再开始写 UI
