import {
  ApiOutlined, AppstoreOutlined, BankOutlined, BarChartOutlined, BuildOutlined,
  BugOutlined, CalendarOutlined, CustomerServiceOutlined, DatabaseOutlined,
  DesktopOutlined, ExperimentOutlined, FileProtectOutlined, HeatMapOutlined,
  HistoryOutlined, HomeOutlined, InboxOutlined, LaptopOutlined, LayoutOutlined,
  LeftOutlined, PieChartOutlined, RightOutlined, SafetyOutlined, SearchOutlined,
  SettingOutlined, ShoppingCartOutlined, SkinOutlined, ThunderboltOutlined,
  ToolOutlined, TrophyOutlined, WalletOutlined,
} from '@ant-design/icons';
import { Button, Input, Layout, Menu, Tooltip, type MenuProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { meActions } from '@/features/auth/meSlice';
import { useAppDispatch } from '@/app/store';
import styleCss from './layout.module.css';
import UserAvatarToggle from './UserAvatarToggle';
import { findNavigationPage, getNavigationSections, searchNavigationPages } from './navigation';

interface AppSideNavProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  spaces: <BankOutlined />,
  equipment: <DesktopOutlined />, finance: <WalletOutlined />, insights: <BarChartOutlined />,
};

const pageIcons: Record<string, React.ReactNode> = {
  dashboard: <HomeOutlined />, '3d-dashboard': <HeatMapOutlined />, leaderboard: <TrophyOutlined />,
  'booking-calendar': <CalendarOutlined />, 'my-bookings': <HistoryOutlined />,
  mapping: <LayoutOutlined />, rooms: <BankOutlined />, stations: <DatabaseOutlined />,
  benches: <ExperimentOutlined />, computing: <LaptopOutlined />, display: <DesktopOutlined />,
  debugging: <BugOutlined />, networking: <ApiOutlined />, power: <ThunderboltOutlined />,
  accessories: <AppstoreOutlined />, samples: <ExperimentOutlined />, furniture: <SkinOutlined />,
  instruments: <ToolOutlined />, laboratory: <BuildOutlined />, mechanical: <SettingOutlined />,
  other: <InboxOutlined />, licenses: <FileProtectOutlined />,
  purchases: <ShoppingCartOutlined />, expenses: <WalletOutlined />, 'finance-report': <PieChartOutlined />,
  analytics: <BarChartOutlined />, monitoring: <SafetyOutlined />,
  'support-tickets': <CustomerServiceOutlined />,
};

const AppSideNav = ({ collapsed, setCollapsed }: AppSideNavProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username, displayName, avatar, isCoordinator } = useAuthState();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const searchRef = useRef<React.ComponentRef<typeof Input>>(null);
  const sections = useMemo(() => getNavigationSections(isCoordinator), [isCoordinator]);
  const active = findNavigationPage(pathname, sections);
  const activeSection = active && active.section.pages.length > 1
    ? active.section.key : undefined;
  const [expansion, setExpansion] = useState<{ context: string; keys: string[] }>({
    context: `${pathname}:${isCoordinator}`, keys: activeSection ? [activeSection] : [],
  });
  const context = `${pathname}:${isCoordinator}`;
  // A new route reveals its section; manual accordion choices apply until navigation.
  const openKeys = expansion.context === context
    ? expansion.keys : activeSection ? [activeSection] : [];
  const searching = !collapsed && query.trim().length > 0;

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 1000px)');
    const handleChange = (event: MediaQueryListEvent) => setCollapsed(event.matches);
    breakpoint.addEventListener('change', handleChange);
    return () => breakpoint.removeEventListener('change', handleChange);
  }, [setCollapsed]);

  const menuItems = useMemo<MenuProps['items']>(() => {
    if (searching) {
      return searchNavigationPages(query, sections).map(({ section, page }) => ({
        key: page.path, icon: pageIcons[page.icon],
        label: <span className={styleCss.searchResult}>
          <span>{page.label}</span><small>{section.label}</small>
        </span>,
      }));
    }
    return sections.map((section) => section.pages.length === 1 ? {
      key: section.pages[0].path, icon: pageIcons[section.pages[0].icon], label: section.pages[0].label,
    } : {
      key: section.key, icon: sectionIcons[section.key], label: section.label,
      children: section.pages.map((page) => ({
        key: page.path,
        icon: pageIcons[page.icon],
        label: page.label,
      })),
    });
  }, [query, searching, sections]);

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const newlyOpened = keys.find((key) => !openKeys.includes(key));
    setExpansion({ context, keys: newlyOpened ? [newlyOpened] : keys.slice(-1) });
  };

  return (
    <Layout.Sider collapsed={collapsed} className={`${styleCss.sidebar} ${styleCss.modernSidebar}`} width={248}>
      <nav className={styleCss.sidebarInner} aria-label="Main navigation">
        <Tooltip title={collapsed ? 'Expand navigation' : 'Collapse navigation'} placement="right">
          <Button aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={styleCss.btn__collapsed} icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => setCollapsed(!collapsed)} shape="circle" />
        </Tooltip>

        <div className={`${styleCss.navigationTools} ${collapsed ? styleCss.navigationToolsCollapsed : ''}`}>
          {collapsed ? (
            <Tooltip title="Find a page" placement="right">
              <Button type="text" icon={<SearchOutlined />} aria-label="Find a page"
                onClick={() => {
                  setCollapsed(false);
                  requestAnimationFrame(() => searchRef.current?.focus());
                }} />
            </Tooltip>
          ) : (
            <>
              <span className={styleCss.navigationCaption}>Workspace</span>
              <Input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)}
                prefix={<SearchOutlined />} placeholder="Find a page" aria-label="Find a page" allowClear
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setQuery('');
                  if (event.key === 'Enter' && query.trim()) {
                    const first = searchNavigationPages(query, sections)[0];
                    if (first) { navigate(first.page.path); setQuery(''); }
                  }
                }} />
            </>
          )}
        </div>

        <div className={styleCss.menu}>
          <Menu mode={collapsed ? 'vertical' : 'inline'} theme="dark" inlineCollapsed={collapsed}
            selectedKeys={active ? [active.page.path] : []}
            openKeys={searching ? [] : openKeys} onOpenChange={onOpenChange}
            onSelect={({ key }) => { navigate(key); setQuery(''); }}
            className={searching ? styleCss.searchMenu : undefined} items={menuItems} />
        </div>
        {searching && menuItems?.length === 0 && (
          <div className={styleCss.navigationEmpty} role="status">No matching pages. Try another name.</div>
        )}

        <UserAvatarToggle username={username} displayName={displayName} avatar={avatar} collapsed={collapsed}
          onUploadSuccess={(url) => dispatch(meActions.setAvatar(url))}
          onRemoveSuccess={() => dispatch(meActions.setAvatar(null))} />
      </nav>
    </Layout.Sider>
  );
};

export default React.memo(AppSideNav);