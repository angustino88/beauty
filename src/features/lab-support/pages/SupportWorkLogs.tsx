import { useState } from 'react';
import { Button, DatePicker, Empty, Segmented, Select, Table, type TableProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCan } from '@/features/auth/hooks/useCan';
import {
  useSupportTeamsOptionsRetrieveQuery,
  useSupportWorkLogsContributorsRetrieveQuery,
  useSupportWorkLogsRetrieveQuery,
  useSupportWorkLogsSummaryRetrieveQuery,
  type WorkLogContributorRead,
} from '@/shared/api/generated/api';
import { InlineAlert } from '@/shared/notifications';
import { SupportPeopleSelect } from '../components/SupportPeopleSelect';
import { WorkLogMetrics, WorkLogTable } from '../components/WorkLogTable';
import { formatWorkDuration } from '../ticketPresentation';
import styles from '../components/SupportTickets.module.css';

const PAGE_SIZE = 15;
type Scope = 'mine' | 'team';
type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function SupportWorkLogs() {
  const can = useCan();
  const canSeeTeam = can('support.handle') || can('support.administer');
  const [scope, setScope] = useState<Scope>('mine');
  const [dates, setDates] = useState<DateRange>(() => [dayjs().subtract(29, 'day'), dayjs()]);
  const [teamId, setTeamId] = useState<number>();
  const [author, setAuthor] = useState<{ value: number; label: string }>();
  const [page, setPage] = useState(1);
  const [contributorsPage, setContributorsPage] = useState(1);

  const activeScope = canSeeTeam ? scope : 'mine';
  const showTeam = activeScope === 'team';
  const baseFilters = {
    scope: activeScope,
    startedAfter: dates?.[0]?.startOf('day').toISOString(),
    startedBefore: dates?.[1]?.add(1, 'day').startOf('day').toISOString(),
    teamId: showTeam ? teamId : undefined,
  };
  const filters = { ...baseFilters, authorId: showTeam ? author?.value : undefined };
  const entries = useSupportWorkLogsRetrieveQuery({ ...filters, page, pageSize: PAGE_SIZE });
  const summary = useSupportWorkLogsSummaryRetrieveQuery(filters);
  const contributors = useSupportWorkLogsContributorsRetrieveQuery(
    { ...baseFilters, page: contributorsPage, pageSize: 8 },
    { skip: !showTeam },
  );
  const teams = useSupportTeamsOptionsRetrieveQuery({ includeIds: teamId ? [teamId] : undefined }, { skip: !showTeam });

  const filterByAuthor = (nextAuthor?: { value: number; label: string }) => {
    setAuthor(nextAuthor);
    setPage(1);
  };

  const columns: TableProps<WorkLogContributorRead>['columns'] = [
    {
      title: 'Contributor',
      key: 'name',
      render: (_, person) => (
        <Button
          type="link"
          size="small"
          className={styles.contributorLink}
          aria-pressed={author?.value === person.id}
          onClick={() => filterByAuthor(author?.value === person.id ? undefined : { value: person.id, label: person.name })}
        >
          {person.name}
        </Button>
      ),
    },
    { title: 'Tickets', dataIndex: 'ticket_count', align: 'right', width: 90 },
    { title: 'Entries', dataIndex: 'entry_count', align: 'right', width: 90 },
    {
      title: 'Time logged',
      dataIndex: 'total_minutes',
      align: 'right',
      width: 120,
      render: (minutes: number) => <strong>{formatWorkDuration(minutes)}</strong>,
    },
  ];

  return (
    <div className={styles.workLogReportPage}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link className={styles.backLink} to="/support-tickets"><ArrowLeftOutlined /> Support queue</Link>
      </nav>
      <PageHeader title="Work logs" />
      <section className={styles.panelCard} aria-label="Work log filters">
        <div className={styles.reportFilters}>
          {canSeeTeam && (
            <Segmented<Scope>
              aria-label="Report scope"
              value={activeScope}
              options={[{ label: 'My work', value: 'mine' }, { label: 'Team overview', value: 'team' }]}
              onChange={(value) => {
                setScope(value);
                setPage(1);
                setContributorsPage(1);
              }}
            />
          )}
          <div className={styles.reportFilterInputs}>
            <DatePicker.RangePicker
              aria-label="Work dates"
              value={dates}
              format="DD MMM YYYY"
              placeholder={['Start date', 'End date']}
              onChange={(value) => {
                setDates(value);
                setPage(1);
                setContributorsPage(1);
              }}
            />
            {showTeam && (
              <>
                <Select<number>
                  aria-label="Support team"
                  placeholder="All support teams"
                  value={teamId}
                  allowClear
                  loading={teams.isFetching}
                  notFoundContent={teams.isError ? 'Could not load support teams' : 'No support teams'}
                  options={(teams.currentData?.data ?? []).map(({ id, name }) => ({ value: id, label: name }))}
                  onChange={(value) => {
                    setTeamId(value);
                    setPage(1);
                    setContributorsPage(1);
                  }}
                />
                <SupportPeopleSelect<number>
                  aria-label="Contributor"
                  placeholder="All contributors"
                  value={author?.value}
                  includePeople={author ? [author] : []}
                  allowClear
                  onChange={(value, option) => filterByAuthor(
                    typeof value === 'number' && option && !Array.isArray(option)
                      ? { value, label: option.label }
                      : undefined,
                  )}
                />
              </>
            )}
          </div>
        </div>
      </section>
      {summary.isError && (
        <InlineAlert variant="error" title="Could not load work log totals" onRetry={() => void summary.refetch()} />
      )}
      <WorkLogMetrics summary={summary.currentData?.data} scope={activeScope} />

      {showTeam && (
        <section className={styles.panelCard} aria-label="Time by contributor">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Time by contributor</h2>
          </header>
          <div className={styles.reportTableBody}>
            {contributors.isError ? (
              <InlineAlert variant="error" title="Could not load contributors" onRetry={() => void contributors.refetch()} />
            ) : (
              <Table<WorkLogContributorRead>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={contributors.currentData?.data ?? []}
                loading={contributors.isFetching}
                scroll={{ x: 420 }}
                pagination={{
                  current: contributorsPage,
                  pageSize: 8,
                  total: contributors.currentData?.meta.pagination.count ?? 0,
                  onChange: setContributorsPage,
                  hideOnSinglePage: true,
                  showSizeChanger: false,
                }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No contributors in this date range" /> }}
              />
            )}
          </div>
        </section>
      )}

      <section className={styles.panelCard} aria-label="Work log entries">
        <header className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{showTeam && author ? `Entries by ${author.label}` : 'Work entries'}</h2>
          {showTeam && author && <Button size="small" onClick={() => filterByAuthor()}>Clear contributor</Button>}
        </header>
        <div className={styles.reportTableBody}>
          {entries.isError ? (
            <InlineAlert variant="error" title="Could not load work entries" onRetry={() => void entries.refetch()} />
          ) : (
            <WorkLogTable
              rows={entries.currentData?.data ?? []}
              page={page}
              pageSize={PAGE_SIZE}
              total={entries.currentData?.meta.pagination.count ?? 0}
              onPageChange={setPage}
              loading={entries.isFetching}
              showTicket
              emptyLabel="No work entries match these filters"
            />
          )}
        </div>
      </section>
    </div>
  );
}
