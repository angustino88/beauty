import { useMemo, useState } from 'react';
import { Alert, Button, Modal, Radio, Segmented, Space, Steps, Table, Tag, Typography, Upload, message } from 'antd';
import type { TableColumnsType, UploadFile } from 'antd';
import { CloudDownloadOutlined, DownloadOutlined, FileExcelOutlined, InboxOutlined } from '@ant-design/icons';
import {
  useApplyWorkbookMutation,
  useCheckWorkbookMutation,
  useDownloadWorkbookExportMutation,
  useDownloadWorkbookTemplateMutation,
} from '../api.ts';
import { mapApplyErrorDetail, problemsToCsv, sortProblems } from '../mapper.ts';
import type { ApiErrorDetail, ImportMode, ImportProblem, ImportReport, ImportSheetOutcome } from '../types.ts';

const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
}

function apiErrorMessage(error: unknown): string {
  const body = (error as { data?: { error?: { message?: string } } })?.data;
  return body?.error?.message ?? 'The request failed. Try again.';
}

function apiErrorDetails(error: unknown): ApiErrorDetail[] {
  const details = (error as { data?: { error?: { details?: ApiErrorDetail[] } } })?.data?.error?.details;
  return Array.isArray(details) ? details : [];
}

function downloadCsv(problems: ImportProblem[]) {
  const blob = new Blob([String.fromCharCode(0xfeff), problemsToCsv(problems)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'workbook-problems.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

const count = (color: string) => (value: number) => (value ? <Tag color={color}>{value}</Tag> : 0);

function sheetColumns(mode: ImportMode): TableColumnsType<ImportSheetOutcome> {
  return [
    { title: 'Sheet', dataIndex: 'name' },
    { title: 'Rows', dataIndex: 'rows', width: 80, align: 'right' },
    { title: 'New', dataIndex: 'created', width: 90, align: 'right', render: count('success') },
    ...(mode === 'upsert'
      ? [{ title: 'Updated', dataIndex: 'updated', width: 100, align: 'right' as const, render: count('processing') }]
      : []),
    { title: mode === 'upsert' ? 'Unchanged' : 'Already there', dataIndex: 'existing', width: 120, align: 'right' },
    { title: 'Rows with errors', dataIndex: 'failed', width: 140, align: 'right', render: count('error') },
  ];
}

const problemColumns: TableColumnsType<ImportProblem> = [
  {
    title: '',
    dataIndex: 'severity',
    width: 90,
    render: (value: ImportProblem['severity']) =>
      value === 'error' ? <Tag color="error">Error</Tag> : <Tag color="warning">Warning</Tag>,
  },
  { title: 'Sheet', dataIndex: 'sheet', width: 160 },
  { title: 'Row', dataIndex: 'row', width: 70, render: (value: number | null) => value ?? '—' },
  { title: 'Column', dataIndex: 'column', width: 170, render: (value: string | null) => value ?? '—' },
  { title: 'Problem', dataIndex: 'message' },
];

const MODE_HELP: Record<ImportMode, string> = {
  create: 'Every asset tag in the file must be new. A tag that already exists is reported as an error.',
  upsert:
    'Rows whose asset tag exists update that record; other rows are created. Blank cells keep the stored value. '
    + 'The asset tag (SKU) itself can never be changed.',
};

function changeSummary(report: ImportReport): string {
  const parts = [`${report.summary.created} new`];
  if (report.mode === 'upsert') parts.push(`${report.summary.updated} updated`);
  return parts.join(', ');
}

export default function WorkbookImportModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<ImportMode>('create');
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [applied, setApplied] = useState<ImportReport | null>(null);
  const [applyProblems, setApplyProblems] = useState<ImportProblem[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [checkWorkbook, { isLoading: checking }] = useCheckWorkbookMutation();
  const [applyWorkbook, { isLoading: applying }] = useApplyWorkbookMutation();
  const [downloadTemplate, { isLoading: downloadingTemplate }] = useDownloadWorkbookTemplateMutation();
  const [downloadExport, { isLoading: exporting }] = useDownloadWorkbookExportMutation();

  const step = applied ? 2 : report ? 1 : 0;
  const changes = report ? report.summary.created + report.summary.updated : 0;
  const problems = useMemo(() => {
    const source = applyProblems.length ? applyProblems : report?.problems ?? [];
    const sorted = sortProblems(source, (report?.sheets ?? []).map((sheet) => sheet.name));
    return filter === 'all' ? sorted : sorted.filter((problem) => problem.severity === filter);
  }, [applyProblems, report, filter]);
  const alreadyExists = (report?.problems ?? []).some((problem) => problem.code === 'already_exists');

  const reset = () => {
    setFile(null);
    setReport(null);
    setApplied(null);
    setApplyProblems([]);
    setFilter('all');
  };

  const close = () => {
    reset();
    onClose();
  };

  const runCheck = async (selected: File, selectedMode: ImportMode) => {
    setFile(selected);
    setApplyProblems([]);
    try {
      setReport(await checkWorkbook({ file: selected, mode: selectedMode }).unwrap());
    } catch (error) {
      setFile(null);
      setReport(null);
      message.error(apiErrorMessage(error));
    }
  };

  // Changing the mode after a check checks the same file again, so the report always matches the mode.
  const changeMode = (next: ImportMode) => {
    setMode(next);
    if (file && !applied) void runCheck(file, next);
  };

  const handleApply = async () => {
    if (!file) return;
    try {
      setApplied(await applyWorkbook({ file, mode }).unwrap());
    } catch (error) {
      const details = apiErrorDetails(error);
      if (details.length) {
        setApplyProblems(details.map(mapApplyErrorDetail));
        message.error('Nothing was imported: the workbook has errors. Fix them and check again.');
      } else {
        message.error(apiErrorMessage(error));
      }
    }
  };

  const download = async (action: () => { unwrap: () => Promise<unknown> }) => {
    try {
      await action().unwrap();
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  const beforeUpload = (candidate: UploadFile & File) => {
    if (!candidate.name.toLowerCase().endsWith('.xlsx')) {
      message.error('Choose an Excel workbook (.xlsx).');
    } else if (candidate.size > MAX_BYTES) {
      message.error('The workbook must not exceed 10 MB.');
    } else {
      void runCheck(candidate, mode);
    }
    return Upload.LIST_IGNORE;
  };

  const modePicker = (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Radio.Group value={mode} onChange={(event) => changeMode(event.target.value as ImportMode)}
        disabled={checking || applying} optionType="button" buttonStyle="solid"
        options={[
          { label: 'Create new records', value: 'create' },
          { label: 'Update existing records', value: 'upsert' },
        ]} />
      <Typography.Text type="secondary">{MODE_HELP[mode]}</Typography.Text>
    </Space>
  );

  const footer = [
    <Button key="close" onClick={close}>{applied ? 'Close' : 'Cancel'}</Button>,
    step === 1 && (
      <Button key="again" onClick={reset} disabled={applying}>Choose another file</Button>
    ),
    step === 1 && (
      <Button key="apply" type="primary" loading={applying}
        disabled={!report?.isValid || applyProblems.length > 0 || changes === 0 || checking}
        onClick={handleApply}>
        {mode === 'upsert' ? `Apply ${changes} changes` : `Import ${changes} rows`}
      </Button>
    ),
  ].filter(Boolean);

  return (
    <Modal open={open} onCancel={close} title="Excel import and export" width={980} footer={footer} destroyOnHidden>
      <Steps size="small" current={step} style={{ marginBottom: 16 }}
        items={[{ title: 'Choose file' }, { title: 'Check' }, { title: mode === 'upsert' ? 'Applied' : 'Imported' }]} />

      {step === 0 && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert type="info" showIcon message="One workbook for reference data, spaces and equipment"
            description={(
              <>
                To add records, download the <b>template</b>, fill the sheets from left to right and upload it. To change
                records, download the <b>current data</b>, edit it and upload it with <b>Update existing records</b>.
                The check lists every problem and saves nothing; the import then saves every row, or nothing if any row
                has an error.
              </>
            )} />
          <Space wrap>
            <Button icon={<DownloadOutlined />} loading={downloadingTemplate} onClick={() => download(downloadTemplate)}>
              Download template
            </Button>
            <Button icon={<CloudDownloadOutlined />} loading={exporting} onClick={() => download(downloadExport)}>
              Export current data
            </Button>
          </Space>
          {modePicker}
          <Upload.Dragger accept=".xlsx" multiple={false} showUploadList={false} beforeUpload={beforeUpload}
            disabled={checking}>
            <p className="ant-upload-drag-icon">{checking ? <FileExcelOutlined /> : <InboxOutlined />}</p>
            <p className="ant-upload-text">{checking ? 'Checking the workbook…' : 'Click or drop the filled workbook here'}</p>
            <p className="ant-upload-hint">.xlsx, at most 10 MB and 5,000 rows per sheet</p>
          </Upload.Dragger>
        </Space>
      )}

      {step === 1 && report && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {modePicker}
          {applyProblems.length > 0 ? (
            <Alert type="error" showIcon message="Nothing was imported"
              description="The data changed since the check, or the import found new problems. Fix them and check again." />
          ) : report.isValid && changes === 0 ? (
            <Alert type="info" showIcon message="Nothing to change"
              description="Every row matches the data in the system." />
          ) : report.isValid ? (
            <Alert type="success" showIcon message={`Ready: ${changeSummary(report)}`}
              description={`${report.summary.existing} rows match the system and stay as they are.${
                report.summary.warningCount ? ` ${report.summary.warningCount} warnings: read them before importing.` : ''}`} />
          ) : (
            <Alert type="error" showIcon
              message={`${report.summary.errorCount} problems must be fixed before the import`}
              description={alreadyExists && mode === 'create'
                ? 'Some asset tags already exist. To change those records, choose Update existing records.'
                : 'Fix them in the workbook and upload it again. Nothing has been saved.'}
              action={alreadyExists && mode === 'create'
                ? <Button size="small" onClick={() => changeMode('upsert')}>Update existing records</Button>
                : undefined} />
          )}
          {report.unknownSheets.length > 0 && (
            <Alert type="warning" showIcon message={`Sheets not read: ${report.unknownSheets.join(', ')}`} />
          )}
          <Typography.Text type="secondary">File: {file?.name} · template {report.templateVersion ?? 'v1'}</Typography.Text>
          <Table<ImportSheetOutcome> size="small" rowKey="key" pagination={false} columns={sheetColumns(report.mode)}
            dataSource={report.sheets.filter((sheet) => sheet.rows > 0)} loading={checking} />
          {(applyProblems.length > 0 || report.problems.length > 0) && (
            <>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Segmented value={filter} onChange={(value) => setFilter(value as typeof filter)} options={[
                  { label: 'All', value: 'all' },
                  { label: 'Errors', value: 'error' },
                  { label: 'Warnings', value: 'warning' },
                ]} />
                <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(problems)}>
                  Download problems (CSV)
                </Button>
              </Space>
              <Table<ImportProblem> size="small" columns={problemColumns} dataSource={problems}
                rowKey={(p) => `${p.severity}|${p.sheet}|${p.row}|${p.column}|${p.code}|${p.message}`}
                pagination={{ pageSize: 10, showSizeChanger: false }} />
            </>
          )}
        </Space>
      )}

      {step === 2 && applied && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert type="success" showIcon message={`Saved: ${changeSummary(applied)}`}
            description={`${applied.summary.existing} rows matched the system and were left as they are.`} />
          <Table<ImportSheetOutcome> size="small" rowKey="key" pagination={false} columns={sheetColumns(applied.mode)}
            dataSource={applied.sheets.filter((sheet) => sheet.rows > 0)} />
        </Space>
      )}
    </Modal>
  );
}
