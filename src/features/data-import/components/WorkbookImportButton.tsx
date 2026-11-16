import { lazy, Suspense, useState } from 'react';
import { Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

const WorkbookImportModal = lazy(() => import('./WorkbookImportModal'));

/** Excel import / export for Labs administrators; renders nothing for everyone else (the API enforces it too). */
export default function WorkbookImportButton() {
  const isAdmin = useSelector((state: RootState) => Boolean(state.me.permissionGroups?.admin));
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <Button icon={<UploadOutlined />} onClick={() => setOpen(true)}>Excel import / export</Button>
      {open && (
        <Suspense fallback={null}>
          <WorkbookImportModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
