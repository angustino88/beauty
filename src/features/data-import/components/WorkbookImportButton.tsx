import { useState } from 'react';
import { Button as AntButton } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/features/auth/hooks/useCan';
import WorkbookImportModal from './WorkbookImportModal';

/** Excel import / export (workbook covers every resource, licenses included) for holders of workbook.import (Lab Administrators); renders nothing for everyone else (the API enforces it too). */
export default function WorkbookImportButton({ variant = 'professional' }: { variant?: 'professional' | 'antd' }) {
  const canImport = usePermission('workbook.import');
  const [open, setOpen] = useState(false);
  if (!canImport) return null;
  return (
    <>
      {variant === 'antd' ? (
        <AntButton icon={<UploadOutlined />} onClick={() => setOpen(true)}>Excel import / export</AntButton>
      ) : (
        // Same control as the neighbouring "View options" button (outline, 36px high).
        <Button variant="outline" onClick={() => setOpen(true)}><FileSpreadsheet />Excel import / export</Button>
      )}
      {open && <WorkbookImportModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
