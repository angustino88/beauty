import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <Result
      status="500"
      title="500 Server Error"
      subTitle="Sorry, something went wrong with the server. The server is currently experiencing issues. Please try again later."
      extra={(
        <Button type="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      )}
    />
  );
}
