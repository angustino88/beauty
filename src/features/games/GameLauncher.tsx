import { Button, Modal } from 'antd';
import { Suspense, useState } from 'react';
import { games } from './registry';

export default function GameLauncher({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(games.length === 1 ? games[0] : undefined);
  if (selected) {
    const Game = selected.Component;
    return <Suspense fallback={null}><Game onClose={onClose} /></Suspense>;
  }
  return (
    <Modal open title="Choose a game" footer={null} onCancel={onClose}>
      {games.map(game => <Button key={game.id} onClick={() => setSelected(game)}>{game.title}</Button>)}
    </Modal>
  );
}
