export interface NavigationPage {
  path: string;
  label: string;
  icon: string;
  aliases?: string[];
}

export interface NavigationSection {
  key: string;
  label: string;
  coordinatorOnly?: boolean;
  pages: NavigationPage[];
}

export const navigationSections: NavigationSection[] = [
  { key: 'dashboard', label: 'Dashboard', pages: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  ] },
  { key: '3d-dashboard', label: '3D Dashboard', pages: [
    { path: '/dashboard/3d', label: '3D Dashboard', icon: '3d-dashboard' },
  ] },
  { key: 'leaderboard', label: 'Leaderboard', pages: [
    { path: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  ] },
  { key: 'booking-calendar', label: 'Booking Calendar', pages: [
    { path: '/booking-calendar', label: 'Booking Calendar', icon: 'booking-calendar' },
  ] },
  { key: 'my-bookings', label: 'My Bookings', pages: [
    { path: '/my-bookings', label: 'My Bookings', icon: 'my-bookings' },
  ] },
  { key: 'spaces', label: 'Spaces', coordinatorOnly: true, pages: [
    { path: '/spaces/mapping', label: 'Mapping', icon: 'mapping' },
    { path: '/spaces/room', label: 'Rooms', icon: 'rooms' },
    { path: '/spaces/station', label: 'Stations', icon: 'stations' },
    { path: '/spaces/bench', label: 'Benches', icon: 'benches' },
  ] },
  { key: 'equipment', label: 'Equipment', coordinatorOnly: true, pages: [
    { path: '/lab-equipment/computing', label: 'Computing', icon: 'computing', aliases: ['/lab-equipment/computer'] },
    { path: '/lab-equipment/display', label: 'Display', icon: 'display', aliases: ['/lab-equipment/monitor'] },
    { path: '/lab-equipment/debugging', label: 'Debugging', icon: 'debugging', aliases: ['/lab-equipment/debug-hardware'] },
    { path: '/lab-equipment/networking', label: 'Networking', icon: 'networking', aliases: ['/lab-equipment/network-interface'] },
    { path: '/lab-equipment/power', label: 'Power', icon: 'power', aliases: ['/lab-equipment/power-supply'] },
    { path: '/lab-equipment/accessory', label: 'Accessories', icon: 'accessories', aliases: ['/lab-equipment/accessories'] },
    { path: '/lab-equipment/sample', label: 'Samples', icon: 'samples' },
    { path: '/lab-equipment/furniture', label: 'Furniture', icon: 'furniture' },
    { path: '/lab-equipment/instrument', label: 'Instruments', icon: 'instruments' },
    { path: '/lab-equipment/laboratory', label: 'Laboratory', icon: 'laboratory' },
    { path: '/lab-equipment/mechanical', label: 'Mechanical', icon: 'mechanical' },
    { path: '/lab-equipment/other', label: 'Other', icon: 'other' },
    { path: '/lab-equipment/license', label: 'Licenses', icon: 'licenses' },
  ] },
  { key: 'telemetry', label: 'Telemetry', coordinatorOnly: true, pages: [
    { path: '/telemetry/devices', label: 'Sensors & gateways', icon: 'telemetry-devices' },
    { path: '/telemetry/profiles', label: 'Device profiles', icon: 'device-profiles' },
  ] },
  { key: 'finance', label: 'Finance', coordinatorOnly: true, pages: [
    { path: '/purchases', label: 'Purchases', icon: 'purchases', aliases: ['/procurement'] },
    { path: '/expenses', label: 'Expenses', icon: 'expenses' },
    { path: '/finance-report', label: 'Finance Report', icon: 'finance-report', aliases: ['/finance'] },
  ] },
  { key: 'insights', label: 'Insights', coordinatorOnly: true, pages: [
    { path: '/lab-analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/lab-monitoring', label: 'Monitoring', icon: 'monitoring' },
  ] },
  { key: 'help', label: 'Help', pages: [
    { path: '/support-tickets', label: 'Support Tickets', icon: 'support-tickets', aliases: ['/lab-support'] },
  ] },
];

export function getNavigationSections(isCoordinator: boolean) {
  return navigationSections.filter((section) => !section.coordinatorOnly || isCoordinator);
}

export function findNavigationPage(pathname: string, sections: NavigationSection[]) {
  return sections.flatMap((section) => section.pages.map((page) => ({ section, page })))
    .filter(({ page }) => [page.path, ...(page.aliases ?? [])].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ))
    .sort((a, b) => b.page.path.length - a.page.path.length)[0];
}

export function searchNavigationPages(query: string, sections: NavigationSection[]) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return sections.flatMap((section) => section.pages.map((page) => ({ section, page })))
    .filter(({ section, page }) => {
      const text = `${section.label} ${page.label}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
}