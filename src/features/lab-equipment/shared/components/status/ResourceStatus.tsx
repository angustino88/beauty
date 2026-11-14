/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { Button, Form, Input, Modal, Select, Tag } from "antd";
import {
  useGetUsersQuery,
  useGetLabNamesListQuery,
} from "../../api/dropdownApi";
import styles from "./ResourceStatus.module.css";
import { StatusBadge } from "@/shared/components/StatusBadge";

export const STATUS_META: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  available: { label: "Available", bgColor: "#41765b", textColor: "#ffffff" },
  free: { label: "Available", bgColor: "#41765b", textColor: "#ffffff" },
  online: { label: "Active", bgColor: "#41765b", textColor: "#ffffff" },
  in_use: { label: "In Use", bgColor: "#176b87", textColor: "#ffffff" },
  occupied: { label: "In Use", bgColor: "#176b87", textColor: "#ffffff" },
  in_storage: { label: "In Storage", bgColor: "#536d7a", textColor: "#ffffff" },
  transferred: {
    label: "Transferred",
    bgColor: "#5d6666",
    textColor: "#ffffff",
  },
  maintenance: {
    label: "Maintenance",
    bgColor: "#b17a2c",
    textColor: "#ffffff",
  },
  borrowed: { label: "Borrowed", bgColor: "#bd6b3d", textColor: "#ffffff" },
  broken: { label: "Broken", bgColor: "#9d4148", textColor: "#ffffff" },
  lost: { label: "Lost", bgColor: "#9d4148", textColor: "#ffffff" },
  on_order: { label: "On Order", bgColor: "#3e7f82", textColor: "#ffffff" },
  // active: { label: "Active", bgColor: "#468847", textColor: "#ffffff" },
  // inactive: { label: "Inactive", bgColor: "#767171", textColor: "#ffffff" },
  // offline: { label: "Inactive", bgColor: "#767171", textColor: "#ffffff" },
  // reserved: { label: "Reserved", bgColor: "#7b2d8b", textColor: "#ffffff" },
  // issue: { label: "Issue", bgColor: "#c0392b", textColor: "#ffffff" },
  // restricted: { label: "Restricted", bgColor: "#e67e22", textColor: "#ffffff" },
  // closed: { label: "Closed", bgColor: "#2c3e50", textColor: "#ffffff" },
  // retired: { label: "Retired", bgColor: "#95a5a6", textColor: "#ffffff" },
};

export const ROOM_STATUS_OPTIONS = [
  { label: "Operational", value: "available" },
  { label: "In Use", value: "in_use" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Issue", value: "issue" },
  { label: "Restricted", value: "restricted" },
  { label: "Closed", value: "closed" },
];

export const RACK_STATUS_OPTIONS = [
  { label: "Operational", value: "available" },
  { label: "In Use", value: "in_use" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Issue", value: "issue" },
  { label: "Retired", value: "retired" },
];

export const RESOURCE_STATUS_OPTIONS = Object.entries(STATUS_META)
  .filter(([key]) => !["free", "occupied", "online", "offline"].includes(key))
  .map(([value, { label }]) => ({ label, value }));

const ORDER_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Canceled", value: "canceled" },
];

const STATUS_DATA_FIELDS: Record<string, string[]> = {
  in_use: ["lab_id"],
  in_storage: ["location", "stored_date", "condition"],
  transferred: ["transfer_to", "transfer_date", "reason", "condition"],
  borrowed: ["borrower", "borrow_date", "return_date", "purpose", "condition"],
  maintenance: ["reason", "from_date", "to_date"],
  broken: ["description", "issue_date", "reason"],
  lost: ["description", "issue_date", "reason"],
  on_order: ["status", "order_date", "purpose"],
};

const COMMON_STATUS_FIELDS = ["responsible", "notes"];

const pickStatusData = (
  data: Record<string, unknown>,
  status: string,
) => Object.fromEntries(
  [...COMMON_STATUS_FIELDS, ...(STATUS_DATA_FIELDS[status] ?? [])]
    .filter((field) => data[field] !== undefined && data[field] !== null && data[field] !== "")
    .map((field) => [field, data[field]]),
);

/* ─── Update Status Modal ─────────────────────────────────── */

interface UpdateResourceStatusModalProps {
  simpleMode?: boolean;
  open: boolean;
  record: {
    id: number;
    sku?: string;
    current_status?: {
      status_type?: string;
      status_data?: Record<string, unknown>;
    } | null;
  };
  onCancel: () => void;
  onSave: (values: {
    status_type: string;
    status_data: Record<string, unknown>;
  }) => void;
  statusOptions?: { label: string; value: string }[];
}

export function UpdateResourceStatusModal({
  open,
  record,
  onCancel,
  onSave,
  statusOptions,
  simpleMode = false,
}: UpdateResourceStatusModalProps) {
  const [form] = Form.useForm();
  const currentStatus = record.current_status?.status_type || "";
  const currentData = (record.current_status?.status_data ?? {}) as Record<
    string,
    unknown
  >;
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const { data: userOptions = [] } = useGetUsersQuery();
  const { data: labNames = [] } = useGetLabNamesListQuery();

  const userSelectOptions = userOptions.map((u) => ({
    label: u.username || u.display_name || String(u.id),
    value: u.id,
  }));

  const labSelectOptions = labNames.map((l) => ({
    label: l.lab_name,
    value: l.id,
    title: l.sku,
  }));

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    const current = (form.getFieldValue("status_data") as Record<string, unknown>) ?? {};
    form.setFieldValue("status_data", pickStatusData(current, value));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (values.status_type === "in_use" && values.status_data?.lab_id) {
        const selectedLab = labNames.find(
          (l) => l.id === values.status_data.lab_id,
        );
        if (selectedLab) {
          values.status_data.lab_name = selectedLab.lab_name;
          values.status_data.lab_sku = selectedLab.sku;
        }
      }
      onSave(values);
    } catch {
      // validation errors shown in UI
    }
  };

  const resolvedData: Record<string, unknown> = { ...currentData };
  if (currentData.responsible && typeof currentData.responsible === "object") {
    const r = currentData.responsible as Record<string, unknown>;
    resolvedData.responsible = r.id ?? r.value ?? r.key ?? undefined;
  }

  return (
    <Modal
      className={styles.modal}
      width={600}
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      title={
        <div className={styles.modalTitle}>
          <span>Equipment status</span>
        </div>
      }
      okText="OK"
      cancelText="Cancel"
      maskClosable={false}
      style={{ top: "10%" }}
      destroyOnHidden
    >
      <div className={styles.scrollArea}>
        <div className={styles.context}>
          <div>
            <span className={styles.contextLabel}>Equipment</span>
            <span className={styles.contextValue}>{record.sku || `ID ${record.id}`}</span>
          </div>
          <Tag
            className={styles.statusTag}
            color={STATUS_META[selectedStatus]?.bgColor ?? "#767171"}
          >
            {STATUS_META[selectedStatus]?.label ?? "Select status"}
          </Tag>
        </div>
        <Form
          className={styles.form}
          form={form}
          layout="vertical"
          initialValues={{
            status_type: currentStatus,
            status_data: pickStatusData(resolvedData, currentStatus),
          }}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Status</h3>
            <Form.Item
              name="status_type"
              label="Current status"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select
                onChange={handleStatusChange}
                placeholder="Select status"
                options={statusOptions ?? RESOURCE_STATUS_OPTIONS}
              />
            </Form.Item>
          </section>

          {!simpleMode && (STATUS_DATA_FIELDS[selectedStatus]?.length ?? 0) > 0 && (
            <section className={styles.detailPanel}>
              <h3 className={styles.sectionTitle}>Status details</h3>

              {/* ── in_use ── */}
              {selectedStatus === "in_use" && (
                <Form.Item
                  name={["status_data", "lab_id"]}
                  label="Lab Name"
                  rules={[{ required: true, message: "Please select a lab" }]}
                >
                  <Select
                    showSearch
                    placeholder="Select lab"
                    optionLabelProp="label"
                    options={labSelectOptions}
                    filterOption={(input, opt) =>
                      (opt?.label ?? "")
                        .toString()
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              )}

              {/* ── in_storage ── */}
              {selectedStatus === "in_storage" && (
                <>
              <Form.Item
                name={["status_data", "location"]}
                label="Location"
                rules={[{ required: true, message: "Please enter location" }]}
              >
                <Input placeholder="Enter Location" />
              </Form.Item>
              <Form.Item
                name={["status_data", "stored_date"]}
                label="Stored Date"
                rules={[
                  { required: true, message: "Please select stored date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "condition"]}
                label="Condition"
                rules={[{ required: true, message: "Please enter condition" }]}
              >
                <Input placeholder="Enter Condition" />
              </Form.Item>
                </>
              )}

              {/* ── transferred ── */}
              {selectedStatus === "transferred" && (
                <>
              <Form.Item
                name={["status_data", "transfer_to"]}
                label="Transfer To"
                rules={[
                  {
                    required: true,
                    message: "Please enter transfer destination",
                  },
                ]}
              >
                <Input placeholder="Enter transfer destination" />
              </Form.Item>
              <Form.Item
                name={["status_data", "transfer_date"]}
                label="Transfer Date"
                rules={[
                  { required: true, message: "Please enter transfer date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "reason"]}
                label="Reason"
                rules={[{ required: true, message: "Please enter reason" }]}
              >
                <Input placeholder="Enter reason" />
              </Form.Item>
              <Form.Item
                name={["status_data", "condition"]}
                label="Condition"
                rules={[{ required: true, message: "Please enter condition" }]}
              >
                <Input placeholder="Enter condition" />
              </Form.Item>
                </>
              )}

              {/* ── borrowed ── */}
              {selectedStatus === "borrowed" && (
                <>
              <Form.Item
                name={["status_data", "borrower"]}
                label="Borrower Name"
                rules={[
                  { required: true, message: "Please enter borrower name" },
                ]}
              >
                <Input placeholder="Enter borrower name" />
              </Form.Item>
              <Form.Item
                name={["status_data", "borrow_date"]}
                label="Borrow Date"
                rules={[
                  { required: true, message: "Please select borrow date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "return_date"]}
                label="Return Date"
                dependencies={[["status_data", "borrow_date"]]}
                rules={[
                  { required: true, message: "Please select return date" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const borrowDate = getFieldValue([
                        "status_data",
                        "borrow_date",
                      ]) as string;
                      if (!value || !borrowDate || value >= borrowDate)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("Return date must be after borrow date"),
                      );
                    },
                  }),
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "purpose"]}
                label="Purpose"
                rules={[{ required: true, message: "Please enter purpose" }]}
              >
                <Input placeholder="Enter purpose" />
              </Form.Item>
              <Form.Item
                name={["status_data", "condition"]}
                label="Condition"
                rules={[{ required: true, message: "Please enter condition" }]}
              >
                <Input placeholder="Enter condition" />
              </Form.Item>
                </>
              )}

              {/* ── maintenance ── */}
              {selectedStatus === "maintenance" && (
                <>
              <Form.Item
                name={["status_data", "reason"]}
                label="Reason"
                rules={[{ required: true, message: "Please enter reason" }]}
              >
                <Input placeholder="Enter details of maintenance" />
              </Form.Item>
              <Form.Item
                name={["status_data", "from_date"]}
                label="From Date"
                dependencies={[["status_data", "to_date"]]}
                rules={[
                  { required: true, message: "Please select from date" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const toDate = getFieldValue([
                        "status_data",
                        "to_date",
                      ]) as string;
                      if (!value || !toDate || value <= toDate)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("From date must be before to date"),
                      );
                    },
                  }),
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "to_date"]}
                label="To Date"
                dependencies={[["status_data", "from_date"]]}
                rules={[
                  { required: true, message: "Please select to date" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const fromDate = getFieldValue([
                        "status_data",
                        "from_date",
                      ]) as string;
                      if (!value || !fromDate || value >= fromDate)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("To date must be after from date"),
                      );
                    },
                  }),
                ]}
              >
                <Input type="date" />
              </Form.Item>
                </>
              )}

              {/* ── broken ── */}
              {selectedStatus === "broken" && (
                <>
              <Form.Item
                name={["status_data", "description"]}
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <Input.TextArea placeholder="Enter description" />
              </Form.Item>
              <Form.Item
                name={["status_data", "issue_date"]}
                label="Issue Date"
                rules={[
                  { required: true, message: "Please select issue date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "reason"]}
                label="Reason"
                rules={[{ required: true, message: "Please enter reason" }]}
              >
                <Input placeholder="Enter reason" />
              </Form.Item>
                </>
              )}

              {/* ── lost ── */}
              {selectedStatus === "lost" && (
                <>
              <Form.Item
                name={["status_data", "description"]}
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <Input.TextArea placeholder="Enter description" />
              </Form.Item>
              <Form.Item
                name={["status_data", "issue_date"]}
                label="Issue Date"
                rules={[
                  { required: true, message: "Please select issue date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "reason"]}
                label="Reason"
                rules={[{ required: true, message: "Please enter reason" }]}
              >
                <Input placeholder="Enter reason" />
              </Form.Item>
                </>
              )}

              {/* ── on_order ── */}
              {selectedStatus === "on_order" && (
                <>
              <Form.Item
                name={["status_data", "status"]}
                label="Order Status"
                rules={[
                  { required: true, message: "Please select order status" },
                ]}
              >
                <Select
                  options={ORDER_STATUS_OPTIONS}
                  placeholder="Select Status"
                />
              </Form.Item>
              <Form.Item
                name={["status_data", "order_date"]}
                label="Order Date"
                rules={[
                  { required: true, message: "Please select order date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name={["status_data", "purpose"]}
                label="Purpose"
                rules={[{ required: true, message: "Please enter purpose" }]}
              >
                <Input placeholder="Enter purpose" />
              </Form.Item>
                </>
              )}
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ownership and notes</h3>
            <Form.Item
              name={["status_data", "responsible"]}
              label="Responsible"
              rules={[
                { required: true, message: "Please select a responsible person" },
              ]}
            >
              <Select
                showSearch
                placeholder="Select responsible person"
                options={userSelectOptions}
                filterOption={(input, opt) =>
                  (opt?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item name={["status_data", "notes"]} label="Notes">
              <Input.TextArea rows={3} placeholder="Add a note about this status change" />
            </Form.Item>
          </section>
        </Form>
      </div>
    </Modal>
  );
}

/* ─── ResourceStatus component ─────────────────────────────── */

interface Props {
  status?: string;
  isEditing?: boolean;
  record?: {
    id: number;
    sku?: string;
    current_status?: {
      status_type?: string;
      status_data?: Record<string, unknown>;
    } | null;
  };
  onStatusChange?: (values: {
    status_type: string;
    status_data: Record<string, unknown>;
  }) => void;
  statusOptions?: { label: string; value: string }[];
  simpleMode?: boolean;
}

export default function ResourceStatus({
  status,
  isEditing,
  record,
  onStatusChange,
  statusOptions,
  simpleMode = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const normalized = status?.trim().toLowerCase() ?? "";
  const meta = STATUS_META[normalized] ?? {
    label: status || "Unknown",
    bgColor: "#767171",
    textColor: "#ffffff",
  };

  if (isEditing && record) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>{meta.label}</Button>
        {isOpen && (
          <UpdateResourceStatusModal
            simpleMode={simpleMode}
            open={isOpen}
            record={record}
            onCancel={() => setIsOpen(false)}
            onSave={(values) => {
              onStatusChange?.(values);
              setIsOpen(false);
            }}
            statusOptions={statusOptions}
          />
        )}
      </>
    );
  }

  return <StatusBadge status={normalized} label={meta.label} />;
}