import { BellOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, List, Popconfirm, Skeleton, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { notify } from '@/shared/notifications';
import { DATETIMEFORMAT, extractBookingErrorMessage } from '@/shared/utils/booking';
import {
  SLOT_WATCH_CHANNELS,
  useCancelSlotWatchMutation,
  useGetSlotWatchesQuery,
} from '../slotWatchApi';
import { SlotWatchModal } from './SlotWatchModal';

const channelLabel = (value: string) => SLOT_WATCH_CHANNELS.find((c) => c.value === value)?.label ?? value;

export type SlotWatchDrawerProps = { open: boolean; onClose: () => void };

/** The user's active slot alerts, with cancel and "add". */
export const SlotWatchDrawer: React.FC<SlotWatchDrawerProps> = ({ open, onClose }) => {
  const [creating, setCreating] = useState(false);
  const { data: watches, isLoading } = useGetSlotWatchesQuery({ status: 'active' }, { skip: !open });
  const [cancelSlotWatch, { isLoading: cancelling }] = useCancelSlotWatchMutation();

  const handleCancel = async (id: number) => {
    try {
      await cancelSlotWatch(id).unwrap();
      notify.success('Slot alert stopped');
    } catch (error) {
      notify.error('Unable to stop slot alert', { description: extractBookingErrorMessage(error) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title={
        <Space>
          <BellOutlined />
          Slot alerts
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          New alert
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton active />
      ) : !watches?.length ? (
        <Empty description="No active slot alerts. Add one to hear when a busy bench frees up." />
      ) : (
        <List
          dataSource={watches}
          renderItem={(watch) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="cancel"
                  title="Stop this slot alert?"
                  okText="Stop"
                  onConfirm={() => handleCancel(watch.id)}
                >
                  <Button size="small" danger loading={cancelling}>
                    Stop
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={watch.benchName}
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      {dayjs(watch.startsAt).format(DATETIMEFORMAT)} – {dayjs(watch.endsAt).format(DATETIMEFORMAT)}
                    </Typography.Text>
                    <Space size={[4, 4]} wrap>
                      {watch.channels.map((channel) => (
                        <Tag key={channel}>{channelLabel(channel)}</Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
      <SlotWatchModal open={creating} onClose={() => setCreating(false)} />
    </Drawer>
  );
};

export default SlotWatchDrawer;
