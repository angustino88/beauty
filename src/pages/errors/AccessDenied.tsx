import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

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
        title="Access denied"
        subTitle="You do not have permission to view this page. Contact your lab administrator if you believe you should have access."
        extra={(
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        )}
      />
    </div>
  );
}
