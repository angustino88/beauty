import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Empty, Popover, Space, Spin, Tag, Typography } from "antd";
import {
  DownOutlined,
  LinkOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useGetBenchMappingQuery } from "@/features/spaces/mapping/api";
import {
  categoryIcon,
  categoryPath,
} from "@/features/spaces/mapping/columns/mappingColumnRenderers";
import { useCategoryKeyById } from "@/features/spaces/mapping/hooks/useCategoryKeyById";
import { resolveCategoryKey } from "@/features/spaces/mapping/utils/categoryKey";
import type { IBench } from "../types";

interface BenchEquipmentCellProps {
  bench: IBench;
  canManageLabOperations: boolean;
  onManageEquipment: (bench: IBench) => void;
}

export function BenchEquipmentCell({
  bench,
  canManageLabOperations,
  onManageEquipment,
}: BenchEquipmentCellProps) {
  const [open, setOpen] = useState(false);
  const count = bench.equipment_count ?? 0;
  const keyById = useCategoryKeyById();
  const { data: mappingRow, isFetching } = useGetBenchMappingQuery(bench.id, {
    skip: !open,
  });

  const equipment = mappingRow?.equipment ?? [];
  const mappingPath = `/spaces/mapping?q=${encodeURIComponent(bench.sku || bench.name || String(bench.id))}`;

  const popoverContent = (
    <div
      style={{ width: 360, maxWidth: "85vw" }}
      onClick={(event) => event.stopPropagation()}
    >
      {isFetching && !mappingRow ? (
        <div style={{ padding: "18px 0", textAlign: "center" }}>
          <Spin size="small" />
        </div>
      ) : equipment.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No equipment assigned to this bench"
          style={{ marginBlock: 10 }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 280,
            overflowY: "auto",
            border: "1px solid var(--lm-border-subtle, #f0f0f0)",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {equipment.map((item, idx) => {
            const categoryKey = resolveCategoryKey(item.category, keyById);
            const basePath = categoryPath(categoryKey);
            const targetPath = basePath
              ? `${basePath}?q=${encodeURIComponent(item.sku || item.name || "")}`
              : `/spaces/mapping?q=${encodeURIComponent(item.sku || item.name || "")}`;
            const meta = [
              item.category?.name,
              item.role && item.role !== "default" ? item.role : null,
            ]
              .filter(Boolean)
              .join(" · ");
            const isLast = idx === equipment.length - 1;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 10px",
                  borderBottom: isLast ? undefined : "1px solid var(--lm-border-subtle, #f0f0f0)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, flex: 1 }}>
                  <span style={{ marginTop: 2, color: "var(--lm-text-secondary, #64748b)", flexShrink: 0 }}>
                    {categoryIcon(categoryKey)}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {item.sku && (
                        <Typography.Text code style={{ fontSize: 11 }}>
                          {item.sku}
                        </Typography.Text>
                      )}
                      <Link
                        to={targetPath}
                        onClick={() => setOpen(false)}
                        style={{
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name || item.sku || `#${item.id}`}
                      </Link>
                    </div>
                    {meta && (
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                        {meta}
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          paddingTop: 4,
        }}
      >
        {canManageLabOperations ? (
          <Button
            type="primary"
            size="small"
            icon={count > 0 ? <SettingOutlined /> : <PlusOutlined />}
            onClick={() => {
              setOpen(false);
              onManageEquipment(bench);
            }}
          >
            {count > 0 ? "Manage equipment" : "Assign equipment"}
          </Button>
        ) : (
          <span />
        )}
        <Link to={mappingPath} onClick={() => setOpen(false)}>
          <Space size={4} style={{ fontSize: 12 }}>
            <LinkOutlined />
            <span>Open in Mapping</span>
          </Space>
        </Link>
      </div>
    </div>
  );

  return (
    <span onClick={(event) => event.stopPropagation()}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        placement="bottomLeft"
        title={
          <Space size={8}>
            <span>Assigned equipment</span>
            <Tag color={count > 0 ? "geekblue" : "default"} style={{ marginInlineEnd: 0 }}>
              {count}
            </Tag>
          </Space>
        }
        content={popoverContent}
      >
        <Button
          size="small"
          type={count > 0 ? "default" : "dashed"}
          style={{
            borderRadius: 999,
            fontSize: 12,
            height: 26,
            paddingInline: 10,
            color: count > 0 ? "var(--lm-accent, #1d4ed8)" : undefined,
            borderColor: count > 0 ? "var(--lm-accent-border, #bfdbfe)" : undefined,
            background: count > 0 ? "var(--lm-accent-soft, #eff6ff)" : undefined,
          }}
        >
          <Space size={4}>
            <span>
              {count} {count === 1 ? "asset" : "assets"}
            </span>
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </Button>
      </Popover>
    </span>
  );
}
