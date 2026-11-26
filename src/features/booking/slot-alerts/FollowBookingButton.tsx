import { BellFilled, BellOutlined } from '@ant-design/icons';
import { Button, type ButtonProps, Tooltip } from 'antd';
import { useState } from 'react';
import { useSlotAlert } from './useSlotAlert';

type Props = { bookingId: number } & Pick<ButtonProps, 'size' | 'type' | 'block'>;

/** One click: get a single alert when this booking ends, finishes early, or is cancelled. */
export function FollowBookingButton({ bookingId, size, type = 'default', block }: Props) {
  const { followBooking, findFollow } = useSlotAlert();
  const [busy, setBusy] = useState(false);

  if (findFollow(bookingId)) {
    return (
      <Tooltip title="You'll be notified when this booking ends. Manage alerts on the Dashboard.">
        <Button size={size} block={block} icon={<BellFilled />} disabled>
          Following
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Get one alert when this booking is about to end, finishes early, or is cancelled">
      <Button
        size={size}
        type={type}
        block={block}
        icon={<BellOutlined />}
        loading={busy}
        onClick={async (event) => {
          event.stopPropagation();
          setBusy(true);
          await followBooking(bookingId);
          setBusy(false);
        }}
      >
        Notify me when this ends
      </Button>
    </Tooltip>
  );
}

export default FollowBookingButton;
