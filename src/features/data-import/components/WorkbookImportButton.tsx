import { lazy, Suspense, useState } from 'react';
import { Button as AntButton } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

const WorkbookImportModal = lazy(() => import('./WorkbookImportModal'));

/** Excel import / export (workbook covers every resource, licenses included) for Labs administrators; renders nothing for everyone else (the API enforces it too). */
export default function WorkbookImportButton({ variant = 'professional' }: { variant?: 'professional' | 'antd' }) {
  const isAdmin = useSelector((state: RootState) => Boolean(state.me.permissionGroups?.admin));
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      {variant === 'antd' ? (
        <AntButton icon={<UploadOutlined />} onClick={() => setOpen(true)}>Excel import / export</AntButton>
      ) : (
        // Same control as the neighbouring "View options" button (outline, 36px high).
        <Button variant="outline" onClick={() => setOpen(true)}><FileSpreadsheet />Excel import / export</Button>
      )}
      {open && (
        <Suspense fallback={null}>
          <WorkbookImportModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
