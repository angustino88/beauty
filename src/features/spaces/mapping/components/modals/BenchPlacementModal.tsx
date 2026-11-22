import { Form, Modal, Select, Space, Button } from "antd";
import { InlineAlert, getApiErrorMessage, notify } from "@/shared/notifications";
import { useLabsStationsOptionsRetrieveQuery } from "@/shared/api/generated/api";
import { filterResourceOption, toResourceOption } from "@/components/inputs/ResourceOption";
import { useGetStationSlotsQuery } from "@/features/spaces/station/api";
import { useGetMappingFilterOptionsQuery, usePlaceBenchMutation } from "../../api";
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

      notify.success("Bench placement updated", {
        code: row.bench.sku || undefined,
        description: row.bench.name || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      notify.error("Unable to update bench placement", {
        description: getApiErrorMessage(err, "Please review the selected location and try again."),
      });
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

      notify.success("Bench removed from station", {
        code: row.bench.sku || undefined,
        description: row.bench.name || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      notify.error("Unable to remove bench from station", {
        description: getApiErrorMessage(err, "Please try again."),
      });
    }
  };

  // SKU on the first line, name on the second; search matches both.
  const roomOptions = (filterOptions?.rooms ?? []).map((room) => toResourceOption(room));
  const stationOptions = (stationData && Array.isArray(stationData.data) ? stationData.data : filterOptions?.stations ?? [])
    .map((station) => toResourceOption(station));
  const slotOptions = (slots ?? []).map((slot) => toResourceOption({ id: slot.id, sku: slot.slot_code, name: slot.label }));

  return (
    <Modal
      open={open}
      title={`Place Bench: ${row?.bench.name || row?.bench.sku || ""}`}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      okText="Save Placement"
      destroyOnHidden
    >
      <div style={{ marginTop: 12 }}>
        <InlineAlert
          variant="info"
          style={{ marginBottom: 16 }}
          title="Mapping hierarchy: Room → Station → Bench Slot"
          description={
            row?.room
              ? `Current: ${row.room.name || row.room.sku}${row.station ? ` / ${row.station.name || row.station.sku}` : ""}${row.station_slot ? ` (Slot ${row.station_slot.slot_code})` : ""}`
              : undefined
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
              optionLabelProp="selectedLabel"
              filterOption={filterResourceOption}
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
              optionLabelProp="selectedLabel"
              filterOption={filterResourceOption}
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
              optionLabelProp="selectedLabel"
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
