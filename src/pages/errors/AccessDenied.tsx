import { Result } from 'antd';

export default function AccessDenied() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Result
        status="403"
        title="403 Access Denied"
        subTitle="Sorry, you don't have the permission to access this page. Please contact lab admin if this is a mistake."
      />
    </div>
  );
}
