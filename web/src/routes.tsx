import { Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ETFList from './pages/ETFList';
import ETFDetail from './pages/ETFDetail';
import Screen from './pages/Screen';
import PoolList from './pages/PoolList';
import PoolDetail from './pages/PoolDetail';
import ScoreRanking from './pages/ScoreRanking';
import ReportBrowser from './pages/ReportBrowser';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  auth?: boolean;
  menu?: {
    name: string;
    icon?: string;
  };
}

export const routes: RouteConfig[] = [
  { path: '/login', element: <Login />, auth: false },
  { path: '/dashboard', element: <Dashboard />, auth: true, menu: { name: '首页看板', icon: 'DashboardOutlined' } },
  { path: '/etfs', element: <ETFList />, auth: true, menu: { name: 'ETF列表', icon: 'OrderedListOutlined' } },
  { path: '/etfs/:code', element: <ETFDetail />, auth: true },
  { path: '/screen', element: <Screen />, auth: true, menu: { name: '全市场筛选器', icon: 'FilterOutlined' } },
  { path: '/pools', element: <PoolList />, auth: true, menu: { name: '标的池管理', icon: 'AppstoreOutlined' } },
  { path: '/pools/:id', element: <PoolDetail />, auth: true },
  { path: '/scores', element: <ScoreRanking />, auth: true, menu: { name: '评分排名', icon: 'TrophyOutlined' } },
  { path: '/reports', element: <ReportBrowser />, auth: true, menu: { name: '报告浏览', icon: 'FileTextOutlined' } },
  { path: '/', element: <Navigate to="/dashboard" replace />, auth: true },
];

export const menuRoutes = routes.filter((r) => r.menu);
