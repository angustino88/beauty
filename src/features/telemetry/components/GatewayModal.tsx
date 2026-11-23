import { Form, Modal, Radio, Typography } from 'antd';
import { useState } from 'react';
import { InlineAlert, notify } from '@/shared/notifications';
import { useBindGatewayScopeMutation, useRegisterGatewayMutation } from '../api';
import { readApiProblem } from '../errors';
import { EquipmentSelect } from './EquipmentSelect';
import { TargetPicker, type TargetValue } from './TargetPicker';

interface GatewayValues {
  equipment_id: number;
  kind: 'room_host' | 'station_pc';
  scope: TargetValue;
}

/** Register the PC that runs the collector service and choose the room (or station) it covers. */
export function GatewayModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: (id: number) => void }) {
  const [form] = Form.useForm<GatewayValues>();
  const [register, registerState] = useRegisterGatewayMutation();
  const [bindScope, bindState] = useBindGatewayScopeMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const kind = Form.useWatch('kind', form);

  const submit = async () => {
    const values = await form.validateFields();
    setProblem(null);
    try {
      const gateway = await register({ equipment_id: values.equipment_id, kind: values.kind }).unwrap();
      await bindScope({ id: gateway.id, target_type: values.scope.type, target_id: values.scope.id }).unwrap();
      notify.success('Telemetry gateway registered');
      onSaved?.(gateway.id);
      form.resetFields();
      onClose();
    } catch (error) {
      setProblem(readApiProblem(error).message);
    }
  };

  return (
    <Modal
      open={open}
      title="Register a gateway"
      okText="Register"
      onOk={() => void submit()}
      onCancel={onClose}
      confirmLoading={registerState.isLoading || bindState.isLoading}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        A gateway is the always-on PC that runs the telemetry collector: it reads the devices in its room and sends
        the readings to Lab Mango. Enroll the PC first (Computing › agent setup), then register it here.
      </Typography.Paragraph>
      {problem && <InlineAlert variant="error" title={problem} style={{ marginBottom: 12 }} />}
      <Form form={form} layout="vertical" initialValues={{ kind: 'room_host' }}>
        <Form.Item name="equipment_id" label="Gateway PC" rules={[{ required: true, message: 'Choose the PC.' }]}>
          <EquipmentSelect />
        </Form.Item>
        <Form.Item name="kind" label="Covers">
          <Radio.Group
            optionType="button"
            options={[
              { value: 'room_host', label: 'A whole room' },
              { value: 'station_pc', label: 'One station' },
            ]}
            onChange={() => form.setFieldValue('scope', undefined)}
          />
        </Form.Item>
        <Form.Item name="scope" label={kind === 'station_pc' ? 'Station' : 'Room'} rules={[{ required: true, message: 'Choose what it covers.' }]}>
          <TargetPicker key={kind} types={[kind === 'station_pc' ? 'station' : 'room']} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default GatewayModal;
