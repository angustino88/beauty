import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you are looking for does not exist or may have been moved."
      extra={(
        <Button type="primary" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      )}
    />
  );
}
