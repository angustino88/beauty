import React from 'react';
import { Gamepad2 } from 'lucide-react';
import {
  ApiOutlined, AppstoreOutlined, BankOutlined, BarChartOutlined, BuildOutlined,
  BugOutlined, CalendarOutlined, CustomerServiceOutlined, DatabaseOutlined,
  DesktopOutlined, ExperimentOutlined, FileProtectOutlined, HeatMapOutlined,
  HistoryOutlined, HomeOutlined, InboxOutlined, LaptopOutlined, LayoutOutlined,
  PieChartOutlined, SafetyOutlined, SettingOutlined, ShoppingCartOutlined, SkinOutlined,
  ThunderboltOutlined, ToolOutlined, TrophyOutlined, WalletOutlined,
} from '@ant-design/icons';
import { navigationSections } from './navigation';

/** The symbol of each section and page: the sidebar and any default image shown for a resource use these. */
export const sectionIcons: Record<string, React.ReactNode> = {
  spaces: <BankOutlined />,
  equipment: <DesktopOutlined />, finance: <WalletOutlined />, insights: <BarChartOutlined />,
};

export const pageIcons: Record<string, React.ReactNode> = {
  dashboard: <HomeOutlined />, '3d-dashboard': <HeatMapOutlined />, leaderboard: <TrophyOutlined />,
  'booking-calendar': <CalendarOutlined />, 'my-bookings': <HistoryOutlined />,
  games: <Gamepad2 size={16} aria-hidden="true" />,
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

/** The symbol of the page a resource lives on: `room`, `station`, `bench`, `license`, or an equipment category key. */
export function resourcePageIcon(type: string): React.ReactNode {
  switch (type) {
    case 'room': return pageIcons.rooms;
    case 'station': return pageIcons.stations;
    case 'bench': return pageIcons.benches;
    case 'license': return pageIcons.licenses;
    default: return equipmentPageIcon(type);
  }
}

/** The page symbol of an equipment category (its `/lab-equipment/<key>` page), or the Other symbol. */
export function equipmentPageIcon(categoryKey: string): React.ReactNode {
  const path = `/lab-equipment/${categoryKey}`;
  const page = navigationSections
    .flatMap((section) => section.pages)
    .find((item) => item.path === path || item.aliases?.includes(path));
  return pageIcons[page?.icon ?? 'other'] ?? pageIcons.other;
}
