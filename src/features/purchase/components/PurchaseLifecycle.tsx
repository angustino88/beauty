import { CheckOutlined, EditOutlined, SendOutlined, InboxOutlined } from '@ant-design/icons';
import styles from './PurchaseDetail.module.css';

const STAGES = [
  { key: 'draft', title: 'Draft', description: 'Order preparation', icon: <EditOutlined /> },
  { key: 'ordered', title: 'Ordered', description: 'Issued to supplier', icon: <SendOutlined /> },
  { key: 'received', title: 'Received', description: 'Delivery confirmed', icon: <InboxOutlined /> },
];

export function PurchaseLifecycle({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const currentIndex = STAGES.findIndex((stage) => stage.key === normalizedStatus);
  const cancelled = normalizedStatus === 'cancelled';

  return (
    <section className={styles.lifecycle} aria-label="Purchase order lifecycle">
      <div className={styles.lifecycleHeading}>
        <h3>Order lifecycle</h3>
        <span>{cancelled ? 'Cancelled · progression stopped' : currentIndex === -1 ? 'Standard order workflow' : `Stage ${currentIndex + 1} of ${STAGES.length}`}</span>
      </div>
      <ol className={`${styles.lifecycleTrack} ${cancelled ? styles.lifecycleStopped : ''}`}>
        {STAGES.map((stage, index) => {
          const complete = currentIndex > index;
          const current = currentIndex === index;
          return (
            <li
              key={stage.key}
              className={`${styles.lifecycleStage} ${complete ? styles.lifecycleComplete : ''} ${current ? styles.lifecycleCurrent : ''}`}
              aria-current={current ? 'step' : undefined}
            >
              <span className={styles.lifecycleNode} aria-hidden="true">{complete ? <CheckOutlined /> : stage.icon}</span>
              <div className={styles.lifecycleText}>
                <div className={styles.lifecycleLabel}>{stage.title}{current && <span className={styles.lifecycleBadge}>Current</span>}</div>
                <p>{stage.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}