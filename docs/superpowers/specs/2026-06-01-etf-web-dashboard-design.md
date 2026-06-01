# ETF 投研平台 — Web 仪表盘设计文档

> **子项目3：** 将报告和分析结果以可视化方式展示在 Web 界面中，支持交互式探索。
> **日期：** 2026-06-01
> **状态：** 设计完成，待实现

---

## 一、设计目标

将子项目1（数据基础设施）和子项目2（投研核心）的后端能力，通过 Web 仪表盘以可视化、交互式的方式呈现给用户。支持：

- 实时查看市场概览、ETF 排名、评分结果
- 交互式筛选全市场 ETF
- 管理标的池、调整权重、查看分析
- 浏览历史报告、在线预览
- 响应式布局，支持桌面端和移动端访问

---

## 二、技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 18.x | UI 组件库 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 快速构建 |
| Admin 模板 | Ant Design Pro | 6.x | 完整布局、路由、权限框架 |
| UI 组件库 | Ant Design | 5.x | 组件库 |
| 图表库 | ECharts | 5.x | 仪表盘、热力图、饼图、雷达图、折线图 |
| 图表库 | TradingView Lightweight Charts | 4.x | K 线图、成交量 |
| 状态管理 | Zustand | 4.x | 客户端状态 |
| 服务端状态 | TanStack Query (React Query) | 5.x | API 数据缓存、同步 |
| 路由 | React Router | 6.x | SPA 路由 |
| 日期处理 | dayjs | 1.x | 日期格式化 |
| HTTP 客户端 | axios | 1.x | API 请求 |

---

## 三、部署架构

### 3.1 前后端同仓库部署（推荐）

```
用户浏览器 → Nginx（服务器）
                  ↓
          ┌───────┴───────┐
          ↓               ↓
     静态资源 (web/dist)   FastAPI API (/api/*)
     (index.html + JS/CSS)  (反向代理到 Uvicorn)
```

**构建流程：**
1. `cd web && npm run build` → 生成 `web/dist/`
2. FastAPI 配置 `StaticFiles` 服务 `web/dist/`
3. 所有非 `/api/*` 路由返回 `index.html`（支持 SPA 前端路由）
4. Docker 构建时一并打包前后端为单一镜像

### 3.2 项目结构

```
etf-research-platform/
├── app/                          # 后端（已有）
│   ├── api/v1/                  # REST API（已有）
│   ├── templates/reports/       # Jinja2 报告模板（已有）
│   └── ...
├── web/                          # 前端（新增）
│   ├── src/
│   │   ├── main.tsx             # 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── routes.tsx           # 路由配置
│   │   ├── api/                 # API 封装层
│   │   ├── types/               # TypeScript 类型定义
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── hooks/               # 自定义 React Hooks
│   │   ├── components/          # 公共复用组件
│   │   ├── pages/               # 页面组件
│   │   ├── utils/               # 工具函数
│   │   └── styles/              # 全局样式
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── reports/                      # 生成报告文件（已有）
└── docs/                         # 文档
```

---

## 四、页面路由设计

### 4.1 路由表

| 路由 | 页面 | 说明 | 需要登录 |
|------|------|------|---------|
| `/login` | 登录页 | 用户名密码登录 | 否 |
| `/dashboard` | 首页看板 | 市场概览 + Top N 排名 + 最近报告 | 是 |
| `/etfs` | ETF 列表 | 全市场 ETF 表格 + 搜索/筛选/分页 | 是 |
| `/etfs/:code` | ETF 详情 | 基础信息 + K 线 + 指标趋势 + 评分雷达图 | 是 |
| `/screen` | 全市场筛选器 | 多条件筛选面板 + 结果表格 + 预置条件 | 是 |
| `/pools` | 标的池管理 | 池列表 + 创建/编辑/删除 | 是 |
| `/pools/:id` | 池详情分析 | 权重配置 + 分布饼图 + 相关性热力图 + 收益曲线 | 是 |
| `/scores` | 评分排名 | 综合评分 Top N + 分类排名 + 模板切换 | 是 |
| `/reports` | 报告浏览 | 历史报告列表 + 在线预览 + 手动触发 | 是 |

### 4.2 导航菜单

```
📊 首页看板      → /dashboard
📈 ETF 列表      → /etfs
🔍 全市场筛选器   → /screen
🎯 标的池管理     → /pools
🏆 评分排名       → /scores
📄 报告浏览       → /reports
```

---

## 五、页面详细设计

### 5.1 首页看板 (/dashboard)

**数据 API：**
- `GET /api/v1/market-data/snapshot` — 最新行情快照
- `GET /api/v1/scores?limit=10` — 综合评分 Top 10
- `GET /api/v1/reports?limit=5` — 最近报告列表

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  市场概览（4 个统计卡片）                                       │
│  ┌────────┬────────┬────────┬────────┐                       │
│  │ 上证指数 │ 深证成指 │ ETF总数 │ 今日成交 │                       │
│  │ +1.85% │ +2.12% │ 1,486  │ 892亿  │                       │
│  └────────┴────────┴────────┴────────┘                       │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌─────────────────────┐      │
│  │ 综合评分 Top 10（表格）    │  │ 分类最佳（表格）      │      │
│  │ 排名 代码 名称 评分 1月   │  │ 分类 最佳ETF 得分    │      │
│  │ ...                      │  │ ...                 │      │
│  └──────────────────────────┘  └─────────────────────┘      │
│                                ┌─────────────────────┐      │
│                                │ 最近报告（列表）      │      │
│                                │ • 核心持仓池周报      │      │
│                                │ • 全市场扫描报告      │      │
│                                └─────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

**组件：**
- `IndicatorCard` × 4 — 市场概览统计
- Ant Design `Table` — Top 10 评分表格（点击行跳转 ETF 详情）
- Ant Design `List` — 最近报告列表

---

### 5.2 ETF 列表 (/etfs)

**数据 API：**
- `GET /api/v1/etfs?page=1&page_size=50` — ETF 列表（分页）
- `GET /api/v1/etfs?search=芯片` — 搜索
- `GET /api/v1/etfs?category=科技` — 按分类筛选
- `GET /api/v1/etfs/categories/list` — 分类选项

**布局：**
- 顶部搜索栏 + 分类下拉筛选
- 主要区域：ETF 表格（分页）
- 列：代码、名称、分类、市场、最新价、涨跌、成交额、操作（查看详情）
- 点击行跳转 `/etfs/:code`

**组件：**
- Ant Design `Table` + `Pagination`
- `ETFCodeTag` — 代码+名称组合
- `ReturnTag` — 涨跌幅标签（红涨绿跌）

---

### 5.3 ETF 详情 (/etfs/:code)

**数据 API：**
- `GET /api/v1/etfs/:code` — ETF 基础信息
- `GET /api/v1/market-data/:code/history` — 历史日线
- `GET /api/v1/indicators/:code` — 最新指标
- `GET /api/v1/indicators/:code/history` — 指标历史
- `GET /api/v1/scores/:code` — 综合评分

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  512760 芯片ETF | 科技/半导体 | 上证 | 规模45亿    +3.25%    │
├──────────────────────────────────────────────────────────────┤
│  [K线行情] [指标趋势] [综合评分] [相关性]  ← Tab 切换        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│        [TradingView Lightweight Charts — K线图]              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  RSI14   夏普1年   波动率20日   最大回撤   综合评分           │
│  68.5    1.85      25.3%       -12.5%     92.5             │
└──────────────────────────────────────────────────────────────┘
```

**Tab 1 — K线行情：**
- TradingView Lightweight Charts 渲染 K 线 + 成交量 + MA5/MA20
- 支持时间周期切换（日/周/月）

**Tab 2 — 指标趋势：**
- ECharts 折线图：RSI、MACD、布林带 历史趋势
- 支持指标选择切换

**Tab 3 — 综合评分：**
- `ScoreRadar` — 5 维度雷达图（收益/风险/夏普/流动性/趋势）
- 评分详情卡片

**Tab 4 — 相关性：**
- 自选 ETF 相关性对比（调用 `/api/v1/analysis/correlation?codes=...`）

**组件：**
- `KLineChart` — TradingView 封装
- `ScoreRadar` — ECharts 雷达图
- `IndicatorCard` — 指标数值卡片

---

### 5.4 全市场筛选器 (/screen)

**数据 API：**
- `GET /api/v1/screen/presets` — 预置筛选条件
- `GET /api/v1/screen/categories` — 分类列表（带计数）
- `GET /api/v1/screen?...` — 筛选结果

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  快速筛选: [高夏普低波动] [趋势强势] [价值洼地] [流动性充足]     │
├──────────────────────────────────────────────────────────────┤
│  市场 ▼   分类 ▼   评分范围 ▼                                  │
│  RSI ▼    夏普 ▼   波动率 ▼                                    │
│  1月收益 ▼  3月收益 ▼  1年收益 ▼                               │
│              [重置条件]  [开始筛选]                            │
├──────────────────────────────────────────────────────────────┤
│  筛选结果 (42只)  排序: 综合评分 ▼                             │
│  代码  名称    分类  评分  RSI  夏普  1月  3月  1年  波动率    │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

**交互：**
- 点击预置 Chip 自动填充筛选条件
- 条件变化实时触发筛选（防抖 300ms）
- 表格列支持点击排序
- 结果表格点击行跳转 ETF 详情

**组件：**
- `FilterPanel` — 筛选条件面板
- Ant Design `Table` + 排序/分页

---

### 5.5 标的池管理 (/pools)

**数据 API：**
- `GET /api/v1/pools` — 池列表
- `POST /api/v1/pools` — 创建池
- `PUT/DELETE /api/v1/pools/:id` — 更新/删除

**布局：**
- 池卡片列表（名称、ETF 数量、创建时间）
- 右上角 "+ 新建池" 按钮
- 点击卡片进入池详情 `/pools/:id`

### 5.6 池详情分析 (/pools/:id)

**数据 API：**
- `GET /api/v1/pools/:id` — 池详情（含成员）
- `GET /api/v1/pools/:id/weights` — 权重配置
- `PUT /api/v1/pools/:id/weights/:code` — 更新权重
- `POST /api/v1/pools/:id/weights/suggest` — 建议权重
- `GET /api/v1/pools/:id/analytics` — 池分析（分类分布、整体表现）
- `GET /api/v1/pools/:id/correlation` — 相关性矩阵
- `GET /api/v1/pools/:id/snapshots` — 历史快照

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  核心持仓池 | 8只ETF | 最新快照 2026-05-30    +添加成员  ⚙️权重 │
├──────────────────────────────────────────────────────────────┤
│  [成员与权重] [持仓分布] [相关性热力图] [收益曲线] [历史快照]   │
├──────────────────────────────────────────────────────────────┤
│  ETF        目标权重  建议权重  偏离    算法来源   操作        │
│  512760     20%      22%      +2%     评分加权   编辑|删除    │
│  ...                                                        │
│  [等权分配] [评分加权] [风险平价]                              │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────┐           │
│  │ [分类分布]   │  │ 池整体表现                   │           │
│  │  [饼图]     │  │ 1月+5.2%  3月+12.1%        │           │
│  │             │  │ 夏普1.85  最大回撤-15.2%    │           │
│  └─────────────┘  └─────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

**Tab 1 — 成员与权重：**
- 表格展示成员 + 目标权重 + 建议权重 + 偏离
- 偏离超过阈值标红提示
- 底部算法按钮：等权/评分加权/风险平价 → 自动计算建议权重
- 编辑模式：滑块调整权重

**Tab 2 — 持仓分布：**
- `CategoryPie` — 分类分布饼图
- `CategoryPie` — 权重分布环形图

**Tab 3 — 相关性热力图：**
- `CorrelationHeatmap` — ECharts 热力图矩阵

**Tab 4 — 收益曲线：**
- `ReturnCurve` — ECharts 多 ETF 收益曲线叠加

**Tab 5 — 历史快照：**
- 快照列表表格（日期、ETF 数量、操作：对比/恢复）

**组件：**
- `WeightEditor` — 权重滑块编辑器
- `CategoryPie` — 饼图/环形图
- `CorrelationHeatmap` — 热力图
- `ReturnCurve` — 收益曲线

---

### 5.7 评分排名 (/scores)

**数据 API：**
- `GET /api/v1/scores/templates` — 评分模板列表
- `GET /api/v1/scores?template_id=1&limit=50` — 评分数据

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  评分模板: [保守型] [均衡型] [进取型]  + 自定义模板              │
├──────────────────────────────────────────────────────────────┤
│  综合评分 Top 20（均衡型模板）                                  │
│  全市场排名  分类排名  代码  名称  综合  收益  风险  夏普  ...  │
│  1           1        512760 芯片  92.5  88   85   95        │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

**交互：**
- 模板切换：点击模板标签 → 重新拉取评分数据
- 表格列含分项得分（收益/风险/夏普/流动性/趋势）
- 点击行跳转 ETF 详情
- 自定义模板：弹窗配置权重，保存后自动出现在模板列表

**组件：**
- `ScoreBar` — 评分进度条（0-100 分彩色渐变）

---

### 5.8 报告浏览 (/reports)

**数据 API：**
- `GET /api/v1/reports?limit=50` — 报告列表
- `POST /api/v1/reports/generate` — 手动触发生成
- `GET /api/v1/reports/:id/status` — 查询生成状态
- `GET /api/v1/reports/:id/download` — 下载报告文件

**布局：**
```
┌──────────────────────────────────────────────────────────────┐
│  类型: [全部] [池周报] [日报]              [+ 生成新报告]      │
├──────────────────────────────────────────────────────────────┤
│  报告类型  标的池    日期       格式  状态    大小   操作      │
│  池周报    核心持仓  2026-05-25 HTML  ✓完成   245KB  预览|下载 │
│  ...                                                         │
├──────────────────────────────────────────────────────────────┤
│  在线预览 — 核心持仓池周报 (2026-05-25)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [iframe 嵌入 reports/weekly_*.html]                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**交互：**
- 类型筛选：切换显示不同报告类型
- 点击 "预览" 在下方 iframe 加载报告 HTML
- 点击 "生成新报告" 弹窗选择池和类型 → 触发异步生成 → 轮询状态
- 生成中显示进度提示，完成后自动刷新列表

**组件：**
- `ReportPreview` — iframe 报告预览

---

## 六、状态管理

### 6.1 Zustand Stores

```typescript
// stores/auth.ts — 认证状态
interface AuthState {
  token: string | null;
  user: { username: string; role: 'admin' | 'user' } | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// stores/screen.ts — 筛选器状态（持久化到 localStorage）
interface ScreenState {
  filters: {
    market?: string;
    category?: string;
    rsiMin?: number; rsiMax?: number;
    sharpeMin?: number; sharpeMax?: number;
    volatilityMin?: number; volatilityMax?: number;
    return1mMin?: number; return1mMax?: number;
    return3mMin?: number; return3mMax?: number;
    return1yMin?: number; return1yMax?: number;
    scoreMin?: number; scoreMax?: number;
    templateId?: number;
  };
  preset: string | null;
  savedFilters: Array<{ name: string; filters: ScreenState['filters'] }>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  applyPreset: (presetKey: string) => void;
}

// stores/pool.ts — 池管理本地状态
interface PoolState {
  selectedPoolId: number | null;
  editingWeights: boolean;
  weightChanges: Record<string, number>; // etf_code -> target_weight
  setWeightChange: (code: string, weight: number) => void;
  commitWeightChanges: () => Promise<void>;
  cancelWeightEdit: () => void;
}
```

### 6.2 TanStack Query 封装

```typescript
// hooks/useETFList.ts
export function useETFList(params: ETFFilterParams) {
  return useQuery({
    queryKey: ['etfs', params],
    queryFn: () => api.etf.list(params),
    staleTime: 60_000,
  });
}

// hooks/useScreenResults.ts
export function useScreenResults(filters: ScreenFilters) {
  return useQuery({
    queryKey: ['screen', filters],
    queryFn: () => api.screen.query(filters),
    staleTime: 30_000,
  });
}

// hooks/usePoolDetail.ts
export function usePoolDetail(id: number) {
  return useQuery({
    queryKey: ['pool', id],
    queryFn: () => api.pool.get(id),
    enabled: !!id,
  });
}
```

---

## 七、API 服务层

### 7.1 Axios 实例配置 (`api/client.ts`)

```typescript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
});

// 请求拦截器：注入 JWT Token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：统一错误处理、401 跳转登录
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### 7.2 API 模块划分

| 模块文件 | 后端端点 | 方法 |
|---------|---------|------|
| `api/auth.ts` | `/auth/login`, `/auth/me` | POST, GET |
| `api/etf.ts` | `/etfs`, `/etfs/:code`, `/etfs/categories/list` | GET |
| `api/market.ts` | `/market-data/:code/history`, `/market-data/snapshot` | GET |
| `api/indicators.ts` | `/indicators/:code`, `/indicators/:code/history` | GET |
| `api/score.ts` | `/scores`, `/scores/:code`, `/scores/templates` | GET, POST, PUT, DELETE |
| `api/screen.ts` | `/screen`, `/screen/presets`, `/screen/categories` | GET |
| `api/pool.ts` | `/pools/*` 所有池相关端点 | CRUD |
| `api/report.ts` | `/reports/*` 所有报告端点 | GET, POST |
| `api/analysis.ts` | `/analysis/correlation` | GET |

---

## 八、登录与权限

### 8.1 登录流程

```
用户输入用户名密码
       ↓
POST /api/v1/auth/login
       ↓
后端验证 → 生成 JWT Token
       ↓
前端存储 token 到 localStorage
       ↓
跳转 /dashboard
```

### 8.2 路由守卫

```typescript
// routes.tsx 中的路由守卫
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
```

### 8.3 权限设计（简化版）

| 角色 | 权限 |
|------|------|
| `admin` | 全部功能：模板管理（创建/修改/删除）、报告生成、系统配置 |
| `user` | 只读 + 池管理：不能删除模板、不能修改系统配置 |

**前端权限控制：**
- 菜单项根据角色条件渲染
- 操作按钮（删除模板、系统设置）仅 admin 可见
- 后端同样做权限校验（不可仅依赖前端）

---

## 九、响应式适配

### 9.1 断点设计

| 断点 | 设备 | 布局 |
|------|------|------|
| ≥1280px | 桌面大屏 | 侧边栏展开（256px），表格全列，图表大尺寸 |
| 992-1279px | 桌面 | 侧边栏展开，表格可横向滚动 |
| 768-991px | 平板 | 侧边栏收起（仅图标），卡片双列 |
| <768px | 手机 | 抽屉式侧边栏，卡片单列，表格简化 |

### 9.2 关键页面适配

| 页面 | 桌面端 | 移动端 |
|------|--------|--------|
| 首页看板 | 4 卡片并排 + 左右分栏 | 卡片纵向堆叠 + 单列 |
| ETF 详情 | K 线全宽 + 指标卡片并排 | K 线全宽 + 指标卡片横向滚动 |
| 筛选器 | 筛选条件并排 + 全列表格 | 筛选条件抽屉 + 简化列表格 |
| 池详情 | Tab 内容全宽 | Tab 保持，内容自适应 |
| 评分排名 | 全列表格 | 隐藏部分列（流动性/趋势） |
| 报告浏览 | 左右分栏（列表+预览） | 列表页 + 预览页（二级页面） |

---

## 十、组件库规划

### 10.1 公共组件

| 组件 | 文件 | 功能 | 依赖 |
|------|------|------|------|
| `ScoreBar` | `components/ScoreBar.tsx` | 评分进度条 0-100 彩色 | Ant Design `Progress` |
| `ETFCodeTag` | `components/ETFCodeTag.tsx` | ETF 代码 + 名称标签 | `Tag` + `Tooltip` |
| `ReturnTag` | `components/ReturnTag.tsx` | 收益率标签（红涨绿跌） | `Tag` |
| `IndicatorCard` | `components/IndicatorCard.tsx` | 指标数值大卡片 | `Card` + `Statistic` |
| `ScoreRadar` | `components/ScoreRadar.tsx` | 5 维度评分雷达图 | ECharts Radar |
| `CorrelationHeatmap` | `components/CorrelationHeatmap.tsx` | 相关性热力图矩阵 | ECharts Heatmap |
| `ReturnCurve` | `components/ReturnCurve.tsx` | 多 ETF 收益曲线对比 | ECharts Line |
| `KLineChart` | `components/KLineChart.tsx` | K 线图 | TradingView |
| `CategoryPie` | `components/CategoryPie.tsx` | 分类分布饼图/环形图 | ECharts Pie |
| `WeightEditor` | `components/WeightEditor.tsx` | 权重滑块编辑器 | `Slider` |
| `FilterPanel` | `components/FilterPanel.tsx` | 筛选条件表单面板 | `Form` + `Select` |
| `ReportPreview` | `components/ReportPreview.tsx` | iframe 报告预览 | `iframe` |

### 10.2 图表使用分配

| 图表类型 | 库 | 使用页面 |
|---------|-----|---------|
| K 线 + 成交量 + MA | TradingView | ETF 详情 |
| 指标趋势折线图 | ECharts | ETF 详情 |
| 评分雷达图 | ECharts | ETF 详情、评分排名 |
| 饼图/环形图 | ECharts | 池详情 |
| 热力图 | ECharts | 池详情 |
| 收益曲线 | ECharts | 池详情、ETF 详情 |
| 柱状图 | ECharts | 排名对比 |

---

## 十一、后端配合改动

子项目3需要后端最小化改动：

| 改动 | 说明 |
|------|------|
| `POST /api/v1/auth/login` | 用户名密码验证，返回 JWT token |
| `GET /api/v1/auth/me` | 获取当前登录用户信息 |
| FastAPI StaticFiles | `app.mount("/", StaticFiles(directory="web/dist", html=True))` |
| CORS（如分离部署） | 配置允许的源地址 |
| `users` 表（可选） | 如需多用户，新增用户表；如单用户，配置文件硬编码 |

**单用户简化方案（推荐 v1）：**
- 不在数据库新增用户表
- 用户名密码写在后端配置文件
- JWT Secret 写在环境变量
- 前端登录时校验配置文件中的凭据

---

## 十二、实现优先级

按依赖关系和用户价值排序：

| 阶段 | 页面 | 说明 |
|------|------|------|
| P0-1 | 登录页 + 布局框架 | Ant Design Pro 初始化、路由、侧边栏 |
| P0-2 | 首页看板 | 市场概览 + Top 10 评分（数据最全，展示效果最好） |
| P0-3 | ETF 列表 + ETF 详情 | 基础功能，K 线图是亮点 |
| P0-4 | 全市场筛选器 | 复用筛选 API，表格展示 |
| P0-5 | 评分排名 | 模板切换 + 排名表格 |
| P1-1 | 标的池管理 + 池详情 | 权重编辑、饼图、热力图 |
| P1-2 | 报告浏览 | 报告列表 + iframe 预览 + 手动生成 |
| P1-3 | 响应式适配 | 移动端断点优化 |

---

## 十三、依赖清单

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@ant-design/pro-components": "^2.6.0",
    "antd": "^5.12.0",
    "echarts": "^5.4.0",
    "echarts-for-react": "^3.0.0",
    "lightweight-charts": "^4.1.0",
    "@tanstack/react-query": "^5.8.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "less": "^4.2.0"
  }
}
```

---

## 十四、设计决策记录

| 决策 | 选项 | 选择 | 理由 |
|------|------|------|------|
| 前端框架 | Vue / React / Svelte | **React** | 生态最丰富，Ant Design Pro 基于 React |
| 图表库 | ECharts / TradingView / Plotly | **ECharts + TradingView** | ECharts 全能，TradingView 专业 K 线 |
| Admin 模板 | 现成模板 / 自建 | **Ant Design Pro** | 快速搭建，内置登录/权限/布局 |
| 状态管理 | Redux / Zustand / Context | **Zustand** | 轻量，API 简洁，配合 TanStack Query |
| 服务端状态 | SWR / TanStack Query | **TanStack Query** | 缓存策略完善，文档好 |
| 部署方式 | 同仓库 / 分离 | **同仓库** | 单部署流程，无 CORS |
| 登录方案 | 数据库用户 / 配置文件 | **配置文件（v1）** | 最小改动，单用户使用 |
| 语言 | JS / TypeScript | **TypeScript** | 类型安全，IDE 体验好 |
