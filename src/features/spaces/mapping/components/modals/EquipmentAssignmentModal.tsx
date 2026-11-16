import { useState } from "react";
import {
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useLabsEquipmentOptionsRetrieveQuery } from "@/shared/api/generated/api";
import {
  useAssignEquipmentMutation,
  useUnassignEquipmentMutation,
} from "../../api";
import type { MappingEquipmentItem, ResourceMappingRow } from "../../types";

interface EquipmentAssignmentModalProps {
  open: boolean;
  row: ResourceMappingRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EquipmentAssignmentModal({
  open,
  row,
  onClose,
  onSuccess,
}: EquipmentAssignmentModalProps) {
  const [form] = Form.useForm<{ equipmentId: number; role?: string; position?: number }>();
  const [search, setSearch] = useState("");
  // The equipment selector is a large catalog: the API rejects it unless `q` is sent, so wait for input.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data: optionsData, isFetching: loadingOptions } = useLabsEquipmentOptionsRetrieveQuery(
    {
      assignable: true,
      assigned: false,
      q: debouncedSearch || undefined,
    },
    { skip: !open || !debouncedSearch },
  );

  const [assignEquipment, { isLoading: assigning }] = useAssignEquipmentMutation();
  const [unassignEquipment, { isLoading: unassigning }] = useUnassignEquipmentMutation();

  const handleAssign = async () => {
    if (!row) return;
    try {
      const values = await form.validateFields();
      await assignEquipment({
        equipmentId: values.equipmentId,
        body: {
          bench_id: row.id,
          role: values.role?.trim() || "default",
          position: values.position ?? 0,
        },
      }).unwrap();

      message.success("Equipment assigned successfully");
      form.resetFields();
      onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ?? "Failed to assign equipment";
      message.error(errorMsg);
    }
  };

  const handleUnassign = async (equipment: MappingEquipmentItem) => {
    if (!row) return;
    try {
      await unassignEquipment({
        equipmentId: equipment.id,
        benchId: row.id,
      }).unwrap();

      message.success(`Unassigned ${equipment.name || equipment.sku} from bench`);
      onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ?? "Failed to unassign equipment";
      message.error(errorMsg);
    }
  };

  const rawEquipmentOptions = Array.isArray(optionsData?.data) ? optionsData.data : [];
  const equipmentOptions = rawEquipmentOptions.map((item) => ({
    // SKU only in the control; the name shows on hover. Search is server-side, so name still matches.
    label: String(item.sku || item.name || item.id),
    title: item.name ?? undefined,
    value: item.id,
  }));

  return (
    <Modal
      open={open}
      title={`Manage Equipment: ${row?.bench.name || row?.bench.sku || ""}`}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Done
        </Button>,
      ]}
      width={680}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 8, fontSize: 13 }}>Assigned Equipment ({row?.equipment.length ?? 0})</h4>
        {(!row?.equipment || row.equipment.length === 0) ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No equipment currently assigned to this bench"
          />
        ) : (
          <List
            size="small"
            bordered
            dataSource={row.equipment}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="unassign"
                    title={`Unassign ${item.name || item.sku}?`}
                    description="This will detach the equipment from this bench."
                    onConfirm={() => handleUnassign(item)}
                    okText="Unassign"
                    cancelText="Cancel"
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      size="small"
                      loading={unassigning}
                    >
                      Unassign
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <strong>{item.name || item.sku}</strong>
                      <Tag color="blue">{item.category?.name || "Equipment"}</Tag>
                      {item.role && <Tag color="default">{item.role}</Tag>}
                      {item.position != null && <Tag color="default">Pos: {item.position}</Tag>}
                    </Space>
                  }
                  description={`SKU: ${item.sku || "N/A"}`}
                />
              </List.Item>
            )}
          />
        )}

        <Divider style={{ margin: "16px 0" }} />

        <Card size="small" title="Assign New Equipment">
          <Form form={form} layout="vertical">
            <Form.Item
              name="equipmentId"
              label="Select Equipment"
              rules={[{ required: true, message: "Please select equipment to assign" }]}
            >
              <Select
                showSearch
                placeholder="Type to search equipment by name or SKU"
                notFoundContent={debouncedSearch ? undefined : "Type a name or SKU to find equipment"}
                options={equipmentOptions}
                loading={loadingOptions}
                onSearch={setSearch}
                filterOption={false}
                allowClear
              />
            </Form.Item>

            <Space align="start" style={{ width: "100%" }}>
              <Form.Item name="role" label="Role (e.g. host, display, accessory)" initialValue="default">
                <Input placeholder="Role" style={{ width: 220 }} />
              </Form.Item>

              <Form.Item name="position" label="Position (optional)" initialValue={0}>
                <InputNumber min={0} placeholder="Position" style={{ width: 140 }} />
              </Form.Item>

              <Form.Item label=" " style={{ alignSelf: "flex-end" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAssign}
                  loading={assigning}
                >
                  Assign
                </Button>
              </Form.Item>
            </Space>
          </Form>
        </Card>
      </div>
    </Modal>
  );
}
