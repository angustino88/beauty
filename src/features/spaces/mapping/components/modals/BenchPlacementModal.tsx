import { Form, Modal, Select, message, Space, Button, Alert } from "antd";
import { useLabsStationsOptionsRetrieveQuery } from "@/shared/api/generated/api";
import {
  useGetMappingFilterOptionsQuery,
  useGetStationSlotsQuery,
  usePlaceBenchMutation,
} from "../../api";
import type { ResourceMappingRow } from "../../types";

interface BenchPlacementModalProps {
  open: boolean;
  row: ResourceMappingRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BenchPlacementModal({
  open,
  row,
  onClose,
  onSuccess,
}: BenchPlacementModalProps) {
  const [form] = Form.useForm<{
    roomId?: number | null;
    stationId?: number | null;
    slotId?: number | null;
  }>();

  const initialRoomId = row?.room?.id ?? row?.station?.room_id ?? null;
  const initialStationId = row?.station?.id ?? row?.bench.setup_location_id ?? null;
  const initialSlotId = row?.station_slot?.id ?? row?.bench.station_slot_id ?? null;

  const watchedRoomId = Form.useWatch("roomId", form);
  const watchedStationId = Form.useWatch("stationId", form);

  const selectedRoomId = watchedRoomId !== undefined ? watchedRoomId : initialRoomId;
  const selectedStationId = watchedStationId !== undefined ? watchedStationId : initialStationId;

  const { data: filterOptions, isLoading: loadingFilters } = useGetMappingFilterOptionsQuery();

  const { data: stationData, isFetching: loadingStations } = useLabsStationsOptionsRetrieveQuery(
    selectedRoomId ? { roomId: selectedRoomId } : {},
    { skip: !open },
  );

  const { data: slots, isFetching: loadingSlots } = useGetStationSlotsQuery(
    selectedStationId as number,
    { skip: !selectedStationId },
  );

  const [placeBench, { isLoading: saving }] = usePlaceBenchMutation();

  const handleSubmit = async () => {
    if (!row) return;
    try {
      const values = await form.validateFields();
      await placeBench({
        benchId: row.id,
        body: {
          setup_location_id: values.stationId ?? null,
          station_slot_id: values.slotId ?? null,
        },
      }).unwrap();

      message.success(`Placement for ${row.bench.name || row.bench.sku} updated`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to update bench placement";
      message.error(errorMsg);
    }
  };

  const handleUnplace = async () => {
    if (!row) return;
    try {
      await placeBench({
        benchId: row.id,
        body: {
          setup_location_id: null,
          station_slot_id: null,
        },
      }).unwrap();

      message.success(`Unplaced ${row.bench.name || row.bench.sku} from station`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to unplace bench";
      message.error(errorMsg);
    }
  };

  const roomOptions = (filterOptions?.rooms ?? []).map((rm) => ({
    label: rm.text,
    value: Number(rm.value),
  }));

  const stationOptions =
    stationData && Array.isArray(stationData.data)
      ? stationData.data.map((st) => ({
          label: st.sku ? `[${st.sku}] ${st.name}` : st.name,
          value: st.id,
        }))
      : (filterOptions?.stations ?? []).map((st) => ({
          label: st.text,
          value: Number(st.value),
        }));

  const slotOptions = (slots ?? []).map((s) => ({
    label: s.label ? `${s.slot_code} (${s.label})` : s.slot_code,
    value: s.id,
  }));

  return (
    <Modal
      open={open}
      title={`Place Bench: ${row?.bench.name || row?.bench.sku || ""}`}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      okText="Save Placement"
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              <strong>Mapping Hierarchy:</strong> Room → Station → Bench Slot
              {row?.room && (
                <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--lm-text-secondary)" }}>
                  Current: {row.room.name || row.room.sku}
                  {row.station ? ` / ${row.station.name || row.station.sku}` : ""}
                  {row.station_slot ? ` (Slot ${row.station_slot.slot_code})` : ""}
                </span>
              )}
            </span>
          }
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            roomId: initialRoomId,
            stationId: initialStationId,
            slotId: initialSlotId,
          }}
        >
          <Form.Item
            name="roomId"
            label="1. Target Room (Filter Stations)"
            tooltip="Select a room to filter stations located in that room"
            rules={[{ required: false }]}
          >
            <Select
              placeholder="Select Room (Optional filter)"
              options={roomOptions}
              loading={loadingFilters}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              onChange={() => {
                form.setFieldValue("stationId", null);
                form.setFieldValue("slotId", null);
              }}
            />
          </Form.Item>

          <Form.Item
            name="stationId"
            label="2. Target Station"
            rules={[{ required: false }]}
          >
            <Select
              placeholder={
                selectedRoomId
                  ? "Select Station in chosen room"
                  : "Select Station (or choose room first)"
              }
              options={stationOptions}
              loading={loadingStations || loadingFilters}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              onChange={() => {
                form.setFieldValue("slotId", null);
              }}
            />
          </Form.Item>

          <Form.Item
            name="slotId"
            label="3. Station Slot"
            rules={[{ required: false }]}
          >
            <Select
              placeholder={
                selectedStationId ? "Select Slot" : "Select a station first"
              }
              options={slotOptions}
              loading={loadingSlots}
              disabled={!selectedStationId}
              allowClear
            />
          </Form.Item>

          <Space style={{ marginTop: 8 }}>
            <Button
              danger
              onClick={handleUnplace}
              loading={saving}
              disabled={!row?.station && !row?.bench.setup_location_id}
            >
              Clear Station Placement
            </Button>
          </Space>
        </Form>
      </div>
    </Modal>
  );
}
