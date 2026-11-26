import { BellOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './SlotAlerts.module.css';

export function SlotAlertsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.empty}>
      <BellOutlined className={styles.emptyIcon} />
      <div>
        <strong>No slot alerts yet.</strong>
        <br />
        Need a bench that's taken? We'll tell you the moment it frees up.
      </div>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        Create slot alert
      </Button>
    </div>
  );
}
