import { BellFilled, BellOutlined } from '@ant-design/icons';
import { Button, type ButtonProps, Tooltip } from 'antd';
import { useState } from 'react';
import { type SlotAlertTarget, useSlotAlert } from './useSlotAlert';

type Props = SlotAlertTarget & Pick<ButtonProps, 'size' | 'type' | 'block'> & { label?: string };

/** One click: watch this bench for this window. Shows "Alert on" when the alert already exists. */
export function NotifyWhenFreeButton({ benchId, startsAt, endsAt, size, type = 'default', block, label }: Props) {
  const { createAlert, findExisting } = useSlotAlert();
  const [busy, setBusy] = useState(false);
  const existing = findExisting({ benchId, startsAt, endsAt });

  if (existing) {
    return (
      <Tooltip title="You'll be notified when this slot frees up. Manage alerts from the Dashboard or My Bookings.">
        <Button size={size} block={block} icon={<BellFilled />} disabled>
          Alert on
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Get notified by Lab Mango, email and Teams as soon as this time frees up">
      <Button
        size={size}
        type={type}
        block={block}
        icon={<BellOutlined />}
        loading={busy}
        onClick={async (event) => {
          event.stopPropagation();
          setBusy(true);
          await createAlert({ benchId, startsAt, endsAt });
          setBusy(false);
        }}
      >
        {label ?? 'Notify me when free'}
      </Button>
    </Tooltip>
  );
}

export default NotifyWhenFreeButton;
