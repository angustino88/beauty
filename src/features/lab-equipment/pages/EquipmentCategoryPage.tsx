import React from 'react';
import { useParams } from 'react-router-dom';
import { Button, Result } from 'antd';
import { EQUIPMENT_CATEGORIES } from '../categories/registry';
import type { EquipmentCategoryKey } from '../types/equipment';
import UnifiedEquipmentPage from '../components/UnifiedEquipmentPage';

export interface EquipmentCategoryPageProps {
  categoryKey?: EquipmentCategoryKey;
}

class EquipmentPageErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <Result status="error" title="Equipment page could not be displayed" subTitle="Reload the page to retry. If the issue persists, report the browser error to support." extra={<Button type="primary" onClick={() => window.location.reload()}>Reload page</Button>} />;
    return this.props.children;
  }
}

export const EquipmentCategoryPage: React.FC<EquipmentCategoryPageProps> = ({ categoryKey: propCategoryKey }) => {
  const { category: paramCategory } = useParams<{ category: string }>();
  const activeKey = (propCategoryKey ?? paramCategory) as EquipmentCategoryKey | undefined;

  const config = activeKey ? EQUIPMENT_CATEGORIES[activeKey] : undefined;

  if (!config) {
    return (
      <Result
        status="404"
        title="Category Not Found"
        subTitle={`The equipment category "${activeKey || ''}" does not exist.`}
      />
    );
  }

  return <EquipmentPageErrorBoundary key={activeKey}><UnifiedEquipmentPage config={config} /></EquipmentPageErrorBoundary>;
};

export default EquipmentCategoryPage;
