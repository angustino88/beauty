import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <Result
      status="500"
      title="Service temporarily unavailable"
      subTitle="The server could not complete your request. Please try again in a few moments."
      extra={(
        <Button type="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      )}
    />
  );
}
