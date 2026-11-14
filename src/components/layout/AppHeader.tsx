import { Layout, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Gamepad2 } from 'lucide-react';
import React, { Suspense, lazy, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoBosch, LogoLabMango } from '@/components/svg';
import { useSeason } from '@/shared/season/useSeason';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SeasonDecor } from './SeasonDecor';
import styleCss from './layout.module.css';

const { Header: AntHeader } = Layout;
const GameWidget = lazy(() => import('@/features/game-widget/components/GameWidget'));

/**
 * App header: brand, the current season's decoration, theme toggle, partner logo.
 * Everything seasonal comes from shared/season; the header itself stays a plain
 * surface so it sits on the same ground as the rest of the app.
 */
const AppHeader = () => {
  const [showGame, setShowGame] = useState(false);
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
        <Tooltip title="Play the mini game">
          <button type="button" className={styleCss.seasonChip} onClick={() => setShowGame(true)}>
            {season.label}
          </button>
        </Tooltip>
      ) : null}

      {season ? <SeasonDecor season={season.id} /> : <div className={styleCss.headerSpacer} />}

      <div className={styleCss.headerActions}>
        {season ? null : (
          <Tooltip title="Play the mini game">
            <button type="button" className={styleCss.headerIconButton} onClick={() => setShowGame(true)} aria-label="Play the mini game">
              <Gamepad2 size={16} />
            </button>
          </Tooltip>
        )}
        <Tooltip title={themeLabel}>
          <button type="button" className={styleCss.headerIconButton} onClick={toggleTheme} aria-label={themeLabel} aria-pressed={isDark}>
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>
        <span className={styleCss.partnerLogo}>
          <LogoBosch />
        </span>
      </div>

      {showGame && (
        <Suspense fallback={null}>
          <GameWidget onClose={() => setShowGame(false)} />
        </Suspense>
      )}
    </AntHeader>
  );
};

export default React.memo(AppHeader);
