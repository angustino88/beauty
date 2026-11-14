import { Col, Grid, Layout, Row, Tooltip, Typography } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import React, { Suspense, lazy, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoBosch, LogoLabMango, LionDanceIcon, Year2026Icon } from '@/components/svg';
import styleCss from './layout.module.css';
import { useTheme } from '@/shared/theme/ThemeContext';

const { Header: AntHeader } = Layout;
const GameWidget = lazy(() => import('@/features/game-widget/components/GameWidget'));

const AppHeader = () => {
  const { lg } = Grid.useBreakpoint();
  const [showGame, setShowGame] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <AntHeader className={styleCss.header}>
      <div className="xmas-lights" style={{ marginBottom: 4 }}>
        <div className="xmas-light red"></div>
        <div className="xmas-light green"></div>
        <div className="xmas-light gold"></div>
        <div className="xmas-light white"></div>
        <div className="xmas-light darkgreen"></div>
        <div className="xmas-light darkred"></div>
      </div>

      <div className={styleCss.reindeer}>
        <LionDanceIcon />
      </div>

      <Row style={{ width: '100%' }}>
        <Col span={21}>
          <NavLink to="/">
            <Row align="middle">
              <Col className={styleCss.headerLeftSection}>
                <div className={styleCss.logoContainer} style={{ position: 'relative' }}>
                  <LogoLabMango />
                </div>
              </Col>

              {lg ? (
                <Col className={styleCss.titleContainer}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Typography.Title level={3} className={styleCss.xmasTitle} aria-label="Lab Mango TET Edition">
                      Lab Mango
                      <span
                        className={styleCss.xmasTag}
                        onClick={(event) => {
                          event.preventDefault();
                          setShowGame(true);
                        }}
                      >
                        TET EDITION
                      </span>
                      <span className={styleCss.xmasEmoji} role="img" aria-label="2026">
                        <Year2026Icon />
                      </span>
                    </Typography.Title>

                    <div className={styleCss.xmasSparkle}>
                      <span style={{ top: '10%', left: '20%' }}>🌸</span>
                      <span style={{ top: '50%', left: '70%' }}>🌸</span>
                      <span style={{ top: '80%', left: '40%' }}>🌸</span>
                    </div>
                  </div>
                </Col>
              ) : null}
            </Row>
          </NavLink>
        </Col>

        <Col span={3}>
          <div className={`${styleCss.headerRightSection} ${styleCss.logoContainer}`}>
            <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              <button
                type="button"
                className={styleCss.themeToggle}
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                aria-pressed={isDark}
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>
            <LogoBosch />
          </div>
        </Col>
      </Row>

      <div className={styleCss.xmasUnderline} />
      {showGame && (
        <Suspense fallback={null}>
          <GameWidget onClose={() => setShowGame(false)} />
        </Suspense>
      )}
    </AntHeader>
  );
};

export default React.memo(AppHeader);
