import { ClearOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { Card, Col, Row } from "antd";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FullTextSearch } from "@/components/inputs/FullTextSearch";
import { TooltipButton } from "@/components/layout/TooltipButton";
import tableStyles from "@/components/tables/AppTable.module.css";
import { BenchBookingCreate } from "../components/BenchBookingCreate";
import {
  MyBookingTable,
  type MyBookingTableHandle,
} from "../components/MyBookingTable";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

export const MyBookings = () => {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableRef = useRef<MyBookingTableHandle>(null);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    tableRef.current?.resetFilters();
  };

  const refetchData = () => {
    tableRef.current?.refetch();
  };

  return (
    <div className={tableStyles.registerPage}>
      <PageHeader title="My Bookings" />
      <Card className={`${tableStyles.tableCard} ${tableStyles.registerCard}`}>
        <Row className={tableStyles.toolbar}>
          <Col flex="auto">
            <FullTextSearch
              className={tableStyles.search}
              value={searchInput}
              onSearch={setSearchInput}
              placeholder="Search by Status, Bench Name, Booking Code, etc."
            />
          </Col>
          <Col flex="auto" className={tableStyles.actions}>
            <TooltipButton
              responsive
              tooltip="Reset all filters and sort"
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              Reset
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Refresh"
              icon={<UndoOutlined />}
              onClick={refetchData}
            >
              Refresh
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Create a new Booking"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              New Booking
            </TooltipButton>
          </Col>
        </Row>

        <MyBookingTable ref={tableRef} search={debouncedSearch} />

        {isModalOpen && (
          <BenchBookingCreate
            modalProps={{ open: isModalOpen, onCancel: handleModalClose }}
            closeModal={handleModalClose}
            refetchBooking={refetchData}
          />
        )}
      </Card>
    </div>
  );
};

export default MyBookings;
