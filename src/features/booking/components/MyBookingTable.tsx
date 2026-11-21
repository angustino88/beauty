import { Table } from "antd";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useGetProjectOptionsQuery } from "../api";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useCan } from "@/features/auth/hooks/useCan";
import { useMyBookingTable } from "../hooks/useMyBookingTable";
import { BenchBookingEdit } from "./BenchBookingEdit";
import { buildMyBookingColumns } from "./MyBookingTable.columns";
import type { BenchBookingItem } from "../types";
import styles from "@/components/tables/AppTable.module.css";
import bookingStyles from './MyBookingTable.module.css';

interface MyBookingTableProps {
  search: string;
}

export interface MyBookingTableHandle {
  refetch: () => void;
  resetFilters: () => void;
}

export const MyBookingTable = forwardRef<
  MyBookingTableHandle,
  MyBookingTableProps
>(({ search }, ref) => {
  const { id, username } = useAuthState();
  const can = useCan();
  const canSeeAll = can("bench_booking.manage_any");

  const { data: projects = [] } = useGetProjectOptionsQuery();

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    bookings,
    totalCount,
    isFetching,
    currentPage,
    pageSize,
    showAll,
    filterParams,
    handleTableChange,
    handleToggleShowAll,
    handleApproveBooking,
    handleRejectBooking,
    resetFilters,
    refetch,
  } = useMyBookingTable(search, { id, username }, canSeeAll);

  useImperativeHandle(ref, () => ({
    refetch,
    resetFilters,
  }));

  const handleEditBooking = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBookingId(null);
  };

  const columns = buildMyBookingColumns({
    filterParams,
    projects,
    canSeeAll,
    canApprove: can("bench_booking.approve"),
    showAll,
    onToggleShowAll: handleToggleShowAll,
    onEditBooking: handleEditBooking,
    onApproveBooking: handleApproveBooking,
    onRejectBooking: handleRejectBooking,
  });

  return (
    <>
      <Table<BenchBookingItem>
        className={`${styles.table} ${bookingStyles.bookingTable}`}
        columns={columns}
        tableLayout="fixed"
        sticky={{ offsetHeader: 0, offsetScroll: 0 }}
        dataSource={bookings}
        rowKey="id"
        loading={{ spinning: isFetching, tip: "Loading..." }}
        onChange={handleTableChange}
        pagination={{
          total: totalCount,
          pageSizeOptions: [5, 10, 20, 50],
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
          current: currentPage,
          pageSize,
          showTotal: (count) => `Total ${count} items`,
        }}
        scroll={{ x: columns.reduce((width, column) => width + (typeof column.width === 'number' ? column.width : 160), 0), y: "calc(100vh - 320px)" }}
      />

      {isModalVisible && (
        <BenchBookingEdit
          eventId={selectedBookingId!}
          visible={isModalVisible}
          onClose={handleModalClose}
          refetchBooking={resetFilters}
        />
      )}
    </>
  );
});

export default MyBookingTable;
