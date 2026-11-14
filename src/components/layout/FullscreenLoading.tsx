import { Spin } from 'antd';

export function FullscreenLoading() {
  return (
    <Spin
      size="large"
      tip="Loading..."
      fullscreen
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}
