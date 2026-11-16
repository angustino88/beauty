import { useMemo, useState } from 'react';
import { Alert, Button, Modal, Segmented, Space, Steps, Table, Tag, Typography, Upload, message } from 'antd';
import type { TableColumnsType, UploadFile } from 'antd';
import { DownloadOutlined, FileExcelOutlined, InboxOutlined } from '@ant-design/icons';
import { useApplyWorkbookMutation, useCheckWorkbookMutation, useDownloadWorkbookTemplateMutation } from '../api.ts';
import { mapApplyErrorDetail, problemsToCsv, sortProblems } from '../mapper.ts';
import type { ApiErrorDetail, ImportProblem, ImportReport, ImportSheetOutcome } from '../types.ts';

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

const sheetColumns: TableColumnsType<ImportSheetOutcome> = [
  { title: 'Sheet', dataIndex: 'name' },
  { title: 'Rows', dataIndex: 'rows', width: 80, align: 'right' },
  { title: 'Create', dataIndex: 'created', width: 90, align: 'right' },
  { title: 'Already there', dataIndex: 'existing', width: 120, align: 'right' },
  {
    title: 'Rows with errors',
    dataIndex: 'failed',
    width: 140,
    align: 'right',
    render: (value: number) => (value ? <Tag color="error">{value}</Tag> : 0),
  },
];

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

export default function WorkbookImportModal({ open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [applied, setApplied] = useState<ImportReport | null>(null);
  const [applyProblems, setApplyProblems] = useState<ImportProblem[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [checkWorkbook, { isLoading: checking }] = useCheckWorkbookMutation();
  const [applyWorkbook, { isLoading: applying }] = useApplyWorkbookMutation();
  const [downloadTemplate, { isLoading: downloading }] = useDownloadWorkbookTemplateMutation();

  const step = applied ? 2 : report ? 1 : 0;
  const problems = useMemo(() => {
    const source = applyProblems.length ? applyProblems : report?.problems ?? [];
    const sorted = sortProblems(source, (report?.sheets ?? []).map((sheet) => sheet.name));
    return filter === 'all' ? sorted : sorted.filter((problem) => problem.severity === filter);
  }, [applyProblems, report, filter]);

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

  const handleCheck = async (selected: File) => {
    setFile(selected);
    setApplyProblems([]);
    try {
      setReport(await checkWorkbook(selected).unwrap());
    } catch (error) {
      setFile(null);
      message.error(apiErrorMessage(error));
    }
  };

  const handleApply = async () => {
    if (!file) return;
    try {
      setApplied(await applyWorkbook(file).unwrap());
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

  const handleTemplate = async () => {
    try {
      await downloadTemplate().unwrap();
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
      void handleCheck(candidate);
    }
    return Upload.LIST_IGNORE;
  };

  const footer = [
    <Button key="close" onClick={close}>{applied ? 'Close' : 'Cancel'}</Button>,
    step === 1 && (
      <Button key="again" onClick={reset} disabled={applying}>Choose another file</Button>
    ),
    step === 1 && (
      <Button key="apply" type="primary" loading={applying} disabled={!report?.isValid || applyProblems.length > 0}
        onClick={handleApply}>
        Import {report?.summary.created ?? 0} rows
      </Button>
    ),
  ].filter(Boolean);

  return (
    <Modal open={open} onCancel={close} title="Import from Excel" width={980} footer={footer} destroyOnHidden>
      <Steps size="small" current={step} style={{ marginBottom: 16 }}
        items={[{ title: 'Choose file' }, { title: 'Check' }, { title: 'Imported' }]} />

      {step === 0 && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert type="info" showIcon message="One workbook for reference data, spaces and equipment"
            description={(
              <>
                Download the template: it already lists the reference data in the system. Fill the sheets from left to
                right and upload the file. The check lists every problem and saves nothing. The import then creates
                every row, or nothing if any row has an error. Existing rooms, stations, benches and equipment are
                never changed.
              </>
            )} />
          <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleTemplate}>
            Download template
          </Button>
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
          {applyProblems.length > 0 ? (
            <Alert type="error" showIcon message="Nothing was imported"
              description="The data changed since the check, or the import found new problems. Fix them and check again." />
          ) : report.isValid ? (
            <Alert type="success" showIcon message={`Ready to import ${report.summary.created} rows`}
              description={`${report.summary.existing} reference rows already exist and stay as they are.${
                report.summary.warningCount ? ` ${report.summary.warningCount} warnings: read them before importing.` : ''}`} />
          ) : (
            <Alert type="error" showIcon
              message={`${report.summary.errorCount} problems must be fixed before the import`}
              description="Fix them in the workbook and upload it again. Nothing has been saved." />
          )}
          {report.unknownSheets.length > 0 && (
            <Alert type="warning" showIcon message={`Sheets not read: ${report.unknownSheets.join(', ')}`} />
          )}
          <Typography.Text type="secondary">File: {file?.name} · template {report.templateVersion ?? 'v1'}</Typography.Text>
          <Table<ImportSheetOutcome> size="small" rowKey="key" pagination={false} columns={sheetColumns}
            dataSource={report.sheets.filter((sheet) => sheet.rows > 0)} />
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
          <Alert type="success" showIcon message={`Imported ${applied.summary.created} rows`}
            description={`${applied.summary.existing} reference rows already existed.`} />
          <Table<ImportSheetOutcome> size="small" rowKey="key" pagination={false} columns={sheetColumns}
            dataSource={applied.sheets.filter((sheet) => sheet.rows > 0)} />
        </Space>
      )}
    </Modal>
  );
}
