import { Layout, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Gamepad2 } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogoBosch, LogoLabMango } from '@/components/svg';
import { useSeason } from '@/shared/season/useSeason';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SeasonDecor } from './SeasonDecor';
import styleCss from './layout.module.css';

const { Header: AntHeader } = Layout;

/**
 * App header: brand, the current season's decoration, theme toggle, partner logo.
 * Everything seasonal comes from shared/season; the header itself stays a plain
 * surface so it sits on the same ground as the rest of the app.
 */
const AppHeader = () => {
  const { isDark, toggleTheme } = useTheme();
  const season = useSeason();
  const themeLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <AntHeader className={`${styleCss.header} ${season ? styleCss.headerInSeason : ''}`}>
      <NavLink to="/" className={styleCss.brand} aria-label="Lab Mango home">
        <LogoLabMango />
        <span className={styleCss.appTitle}>Lab Mango</span>
      </NavLink>

      {season ? (
        <Tooltip title="Game Hub">
          <NavLink to="/games" className={styleCss.seasonChip} aria-label={`${season.label} games`}>
            {season.label}
          </NavLink>
        </Tooltip>
      ) : null}

      {season ? <SeasonDecor season={season.id} /> : <div className={styleCss.headerSpacer} />}

      <div className={styleCss.headerActions}>
        <Tooltip title="Game Hub">
          <NavLink to="/games" className={styleCss.headerIconButton} aria-label="Game Hub">
            <Gamepad2 size={16} />
          </NavLink>
        </Tooltip>
        <Tooltip title={themeLabel}>
          <button type="button" className={styleCss.headerIconButton} onClick={toggleTheme} aria-label={themeLabel} aria-pressed={isDark}>
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>
        <span className={styleCss.partnerLogo}>
          <LogoBosch />
        </span>
      </div>
    </AntHeader>
  );
};

export default React.memo(AppHeader);
