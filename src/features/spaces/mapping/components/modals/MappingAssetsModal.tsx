import { Button, Modal } from "antd";
import { LicenseIcon } from "@/features/lab-equipment/shared/components/EquipmentIcons";
import {
  categoryIcon,
  categoryPath,
  ENTITY_PATHS,
  MappingAsset,
  type MappingAssetKind,
} from "../../columns/mappingColumnRenderers";
import styles from "../../columns/MappingTable.module.css";
import { useCategoryKeyById } from "../../hooks/useCategoryKeyById";
import type { MappingEquipmentItem, ResourceMappingRow } from "../../types";
import { resolveCategoryKey } from "../../utils/categoryKey";

function EquipmentDetails({ equipment }: { equipment: MappingEquipmentItem[] }) {
  const keyById = useCategoryKeyById();
  return (
    <ul className={styles.assetDetailList}>
      {equipment.map((item) => {
        const key = resolveCategoryKey(item.category, keyById);
        const meta = [item.category.name, item.role !== "default" ? item.role : null].filter(Boolean).join(" · ");
        return (
          <li key={item.id}>
            <MappingAsset sku={item.sku} name={item.name} meta={meta} path={categoryPath(key)} icon={categoryIcon(key)} />
          </li>
        );
      })}
    </ul>
  );
}

function LicenseDetails({ equipment, licenses }: Pick<ResourceMappingRow, "equipment" | "licenses">) {
  const equipmentById = new Map(equipment.map((item) => [item.id, item]));
  const byLicenseId = new Map<number, { license: ResourceMappingRow["licenses"][number]; carrierIds: Set<number> }>();
  for (const license of licenses) {
    const group = byLicenseId.get(license.id) ?? { license, carrierIds: new Set<number>() };
    group.carrierIds.add(license.equipment_id);
    byLicenseId.set(license.id, group);
  }

  return (
    <ul className={styles.assetDetailList}>
      {[...byLicenseId.values()].map(({ license, carrierIds }) => {
        const carriers = [...carrierIds].map((id) => {
          const carrier = equipmentById.get(id);
          return carrier?.sku || carrier?.name || `Equipment #${id}`;
        });
        return (
          <li key={license.id}>
            <MappingAsset
              sku={license.sku}
              name={license.name}
              meta={`Assigned to ${carriers.join(", ")}`}
              path={license.sku || license.name ? ENTITY_PATHS.license : null}
              icon={<LicenseIcon />}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function MappingAssetsModal({ row, kind, onClose }: {
  row: ResourceMappingRow | null;
  kind: MappingAssetKind;
  onClose: () => void;
}) {
  const title = kind === "equipment" ? "Equipment" : "Licenses";
  const bench = row?.bench.sku || row?.bench.name;
  return (
    <Modal
      open={row !== null}
      title={bench ? `${title} on ${bench}` : title}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      destroyOnHidden
      width={520}
    >
      {row && (kind === "equipment"
        ? <EquipmentDetails equipment={row.equipment} />
        : <LicenseDetails equipment={row.equipment} licenses={row.licenses} />)}
    </Modal>
  );
}
