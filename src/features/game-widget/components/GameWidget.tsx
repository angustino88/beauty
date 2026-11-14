import GameWidgetView from './GameWidgetView';
import { useGameEngine } from '../hooks/useGameEngine';

const GameWidget = ({ onClose }: { onClose: () => void }) => {
  const engine = useGameEngine();
  return <GameWidgetView onClose={onClose} {...engine} />;
};

export default GameWidget;
