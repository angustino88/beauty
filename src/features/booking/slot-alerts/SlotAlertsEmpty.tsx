import { BellOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './SlotAlerts.module.css';

export function SlotAlertsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.empty}>
      <BellOutlined className={styles.emptyIcon} />
      <div>
        <strong>No alerts</strong>
        <br />
        Need a bench that's booked? Set an alert and we'll notify you when it becomes free.
      </div>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        New alert
      </Button>
    </div>
  );
}
