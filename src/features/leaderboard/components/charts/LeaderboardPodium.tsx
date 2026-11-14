import { Avatar, Skeleton, Typography } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import { getAvatarUrl } from '@/shared/utils/avatar';
import type { RankedPersonaItem, RankedLabItem } from '../../types';

const { Text } = Typography;

type PodiumItem = RankedPersonaItem | RankedLabItem;

interface LeaderboardPodiumProps {
  items: PodiumItem[];
  type: 'persona' | 'lab';
  loading: boolean;
}

const COLORS = {
  bg: '#0d0618',
  brandOrange: '#9c27b0',
  pedestal: 'rgba(20, 10, 40, 0.80)',
  white: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.45)',
};

const AVATAR_SIZES: Record<number, number> = { 1: 110, 2: 85, 3: 85 };
const PEDESTAL_HEIGHTS: Record<number, number> = { 1: 180, 2: 140, 3: 120 };

function PodiumSlot({ item, type }: { item: PodiumItem; type: 'persona' | 'lab' }) {
  const rank = item.rank;
  const isFirst = rank === 1;
  const name = type === 'persona'
    ? (item as RankedPersonaItem).display_name || (item as RankedPersonaItem).username
    : (item as RankedLabItem).lab_name;
  const computerName = type === 'lab' ? (item as RankedLabItem).computer_name : undefined;

  const labImage = type === 'lab' ? (item as RankedLabItem).image : null;
  const labSrc = typeof labImage === 'string' && labImage.trim() ? labImage : undefined;
  const personaSrc = type === 'persona'
    ? getAvatarUrl((item as RankedPersonaItem).avatar, (item as RankedPersonaItem).username) ?? undefined
    : undefined;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      position: 'relative',
      zIndex: isFirst ? 2 : 1,
      marginTop: isFirst ? 0 : 40,
    }}>
      <div style={{ marginBottom: 16 }}>
        <Avatar
          shape="square"
          size={AVATAR_SIZES[rank]}
          src={type === 'persona' ? personaSrc : labSrc}
          icon={type === 'lab' && !labSrc ? <DesktopOutlined /> : undefined}
          style={{
            borderRadius: 24,
            border: isFirst ? `2px solid #9c27b0` : `1px solid rgba(255,255,255,0.1)`,
            background: '#1a0a2e',
            boxShadow: isFirst ? `0 0 40px rgba(156, 39, 176, 0.4)` : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </div>

      <Text strong style={{
        color: COLORS.white,
        fontSize: isFirst ? 22 : 18,
        marginBottom: computerName ? 4 : 20,
        textAlign: 'center',
        display: 'block',
        width: '100%',
        fontFamily: "'Inter', sans-serif",
      }}>
        {name}
      </Text>
      {computerName && (
        <Text style={{
          color: COLORS.muted,
          fontSize: isFirst ? 14 : 12,
          marginBottom: 20,
          textAlign: 'center',
          display: 'block',
          width: '100%',
        }}>
          {computerName}
        </Text>
      )}

      <div style={{
        width: '100%',
        height: PEDESTAL_HEIGHTS[rank],
        background: COLORS.pedestal,
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 12,
              height: 12,
              background: '#ce93d8',
              transform: 'rotate(45deg)',
              boxShadow: `0 0 15px #9c27b0`,
            }} />
            <Text style={{
              color: COLORS.white,
              fontSize: isFirst ? 32 : 24,
              fontWeight: 800,
              lineHeight: 1,
            }}>
              {item.points.toLocaleString()}
            </Text>
          </div>
          <Text style={{
            color: COLORS.muted,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'block',
          }}>
            points
          </Text>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardPodium({ items, type, loading }: LeaderboardPodiumProps) {
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '100px 40px 0', alignItems: 'flex-end' }}>
      <Skeleton.Button active style={{ width: 120, height: 140, borderRadius: '20px 20px 0 0' }} />
      <Skeleton.Button active style={{ width: 140, height: 180, borderRadius: '20px 20px 0 0' }} />
      <Skeleton.Button active style={{ width: 120, height: 120, borderRadius: '20px 20px 0 0' }} />
    </div>
  );

  const top3 = items.slice(0, 3);
  // Reorder for podium display: 2nd place left, 1st place center, 3rd place right
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{
      background: 'radial-gradient(circle at center, #1a0a2e 0%, #0d0618 100%)',
      padding: '60px 40px 0',
      borderRadius: '32px 32px 0 0',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
      borderBottom: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '50%',
        background: `radial-gradient(circle, rgba(156, 39, 176, 0.15) 0%, transparent 70%)`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      {podiumOrder.map((item) => (
        <PodiumSlot key={item.id} item={item} type={type} />
      ))}
    </div>
  );
}
