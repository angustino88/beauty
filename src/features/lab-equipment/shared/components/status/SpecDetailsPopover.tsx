import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Empty, Popover } from 'antd';
import styles from './SpecDetailsPopover.module.css';

export interface SpecDetail {
  label: string;
  value: string;
}

interface SpecDetailsPopoverProps {
  items: SpecDetail[];
}

export function SpecDetailsPopover({ items }: SpecDetailsPopoverProps) {
  return (
    <Popover
      placement="right"
      trigger="click"
      content={
        <div className={styles.panel}>
          <div className={styles.heading}>Technical specifications</div>
          {items.length ? (
            <dl className={styles.list}>
              {items.map((item) => (
                <div className={styles.row} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <Empty
              className={styles.empty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No specifications recorded"
            />
          )}
        </div>
      }
    >
      <Button size="small" icon={<InfoCircleOutlined />}>
        {items.length ? `${items.length} specs` : 'No specs'}
      </Button>
    </Popover>
  );
}
