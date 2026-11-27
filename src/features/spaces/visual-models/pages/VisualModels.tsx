import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Segmented,
  Select,
  Slider,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  assetCacheKey,
  resolveAsset,
  useDeleteVisualModelAssetMutation,
  useSelectVisualModelMutation,
  useUpdateVisualModelAssetMutation,
  useUploadVisualModelAssetMutation,
  useVisualModelAssetsQuery,
  useVisualModelSelectionsQuery,
  type AssetDetails,
  type ModelSegment,
  type VisualModel,
  type VisualModelAsset,
  type VisualModelSelection,
} from "@/features/interactive-dashboard/models/api";
import { ModelPreview } from "@/features/interactive-dashboard/models/ModelPreview";
import { validateGlb } from "@/features/interactive-dashboard/models/validateGlb";
import { getApiErrorMessage, notify } from "@/shared/notifications";

const size = (bytes: number) =>
  bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + " KB"
    : (bytes / 1024 / 1024).toFixed(1) + " MB";

const EMPTY_DETAILS: AssetDetails = {
  name: "",
  source_url: "",
  license: "",
  rotation: 0,
  surface: 1,
};

/** The form edits the work surface in whole percent; integer slider steps avoid float rounding churn. */
type DetailsForm = Omit<AssetDetails, "surface"> & { surface_pct: number };
const toForm = (details: AssetDetails): DetailsForm => {
  const { surface, ...rest } = details;
  return { ...rest, surface_pct: Math.round(surface * 100) };
};
const fromForm = (values: Partial<DetailsForm>): AssetDetails => {
  const { surface_pct, ...rest } = values;
  return { ...EMPTY_DETAILS, ...rest, surface: (surface_pct ?? 100) / 100 };
};

/** Name, attribution and placement of a library model. */
function DetailsFields() {
  // Values are shown in the labels: slider tooltips re-align endlessly inside an animating modal.
  const form = Form.useFormInstance<DetailsForm>();
  const rotation = Form.useWatch("rotation", form) ?? 0;
  const surfacePct = Form.useWatch("surface_pct", form) ?? 100;
  return (
    <>
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: "Name the model." }]}
      >
        <Input maxLength={160} />
      </Form.Item>
      <Form.Item
        name="rotation"
        label={`Facing rotation · ${rotation}°`}
        extra="Turn the model so its front faces the room."
      >
        <Slider min={-180} max={180} step={1} tooltip={{ open: false }} />
      </Form.Item>
      <Form.Item
        name="surface_pct"
        label={`Work surface · ${surfacePct}% of height`}
        extra="Where benches and instruments sit when stations or benches use this model, e.g. the desk top."
      >
        <Slider min={0} max={100} step={1} tooltip={{ open: false }} />
      </Form.Item>
      <Form.Item
        name="source_url"
        label="Source URL"
        rules={[{ type: "url", message: "Enter a full URL." }]}
      >
        <Input placeholder="https://" />
      </Form.Item>
      <Form.Item name="license" label="License / attribution">
        <Input maxLength={255} />
      </Form.Item>
    </>
  );
}

function UploadModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (asset: VisualModelAsset) => void;
}) {
  const [form] = Form.useForm<DetailsForm>();
  const [upload, uploading] = useUploadVisualModelAssetMutation();
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const request = useRef(0);
  const rotation = Form.useWatch("rotation", form) ?? 0;
  const surface = (Form.useWatch("surface_pct", form) ?? 100) / 100;

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const reset = () => {
    request.current++;
    form.resetFields();
    setFile(undefined);
    setUrl("");
    setError("");
    setPreviewFailed(false);
  };

  const choose = async (candidate?: File) => {
    if (!candidate) return;
    const current = ++request.current;
    setError("");
    try {
      await validateGlb(candidate);
      if (current !== request.current) return;
      setFile(candidate);
      setUrl(URL.createObjectURL(candidate));
      setPreviewFailed(false);
      if (!form.getFieldValue("name"))
        form.setFieldValue("name", candidate.name.replace(/\.glb$/i, ""));
    } catch (failure) {
      // Keep any previously chosen valid file; only report the rejected one.
      if (current === request.current) setError((failure as Error).message);
    }
  };

  const preview: VisualModel | undefined = url
    ? {
        cacheKey: url,
        url,
        rotation,
        surface,
        scale: 1,
        offset_x: 0,
        offset_y: 0,
        offset_z: 0,
      }
    : undefined;

  return (
    <Modal
      open={open}
      title="Upload a 3D model"
      width={920}
      okText="Add to library"
      okButtonProps={{ disabled: !file || previewFailed, loading: uploading.isLoading }}
      onCancel={() => {
        reset();
        onClose();
      }}
      onOk={async () => {
        if (!file) return;
        const details = fromForm(await form.validateFields());
        const body = new FormData();
        Object.entries(details).forEach(([key, value]) =>
          body.set(key, String(value ?? "")),
        );
        body.set("file", file);
        try {
          const { asset, created } = await upload(body).unwrap();
          if (created) notify.success(`“${asset.name}” added to the library`);
          else
            notify.info("This file is already in the library", {
              description: `It is stored as “${asset.name}”.`,
            });
          reset();
          onUploaded(asset);
        } catch (failure) {
          setError(getApiErrorMessage(failure, "Unable to upload the model."));
        }
      }}
      destroyOnHidden
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: 20 }}>
        <Form form={form} name="upload-model" layout="vertical" initialValues={toForm(EMPTY_DETAILS)}>
          <Form.Item
            label="GLB file"
            extra="Up to 15 MB with embedded textures. Draco/Meshopt geometry and KTX2/WebP textures are supported."
            validateStatus={error ? "error" : undefined}
            help={error || undefined}
          >
            <input
              type="file"
              aria-label="GLB file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </Form.Item>
          <DetailsFields />
        </Form>
        <div>
          <ModelPreview
            model={preview}
            height={420}
            onError={() => setPreviewFailed(true)}
          />
          {previewFailed && (
            <Typography.Text type="danger">
              The model could not render. Re-export a self-contained GLB with embedded textures.
            </Typography.Text>
          )}
        </div>
      </div>
    </Modal>
  );
}

function AssetDetail({
  asset,
  onDeleted,
}: {
  asset: VisualModelAsset;
  onDeleted: () => void;
}) {
  const [form] = Form.useForm<DetailsForm>();
  const [update, updating] = useUpdateVisualModelAssetMutation();
  const [remove, removing] = useDeleteVisualModelAssetMutation();
  // Version this form was loaded from; the server rejects saves over someone else's edit.
  const [baseVersion, setBaseVersion] = useState(asset.version);
  const [previewFailed, setPreviewFailed] = useState(false);
  const rotation = Form.useWatch("rotation", form) ?? asset.rotation;
  const surfacePct = Form.useWatch("surface_pct", form);
  const surface = surfacePct == null ? asset.surface : surfacePct / 100;
  const preview = useMemo(
    () => resolveAsset({ ...asset, rotation, surface }),
    [asset, rotation, surface],
  );
  const current = { ...asset, version: baseVersion };

  return (
    <Card
      title={asset.name}
      extra={
        <Space>
          <Tag>{size(asset.size)}</Tag>
          <Tag color={asset.usage_count ? "blue" : undefined}>
            Used by {asset.usage_count}
          </Tag>
        </Space>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 340px) 1fr", gap: 20 }}>
        <Form
          form={form}
          name={`model-${asset.id}`}
          layout="vertical"
          initialValues={toForm(asset)}
          onFinish={async (details) => {
            try {
              const saved = await update({
                asset: current,
                details: fromForm(details),
              }).unwrap();
              setBaseVersion(saved.version);
              notify.success("Model saved", {
                description: asset.usage_count
                  ? `Updates ${asset.usage_count} resource(s) and catalog type(s) that use it.`
                  : undefined,
              });
            } catch (failure) {
              notify.error("Unable to save the model", {
                description: getApiErrorMessage(failure, "Please reload and try again."),
              });
            }
          }}
        >
          <DetailsFields />
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={updating.isLoading}>
              Save
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={removing.isLoading}
              disabled={asset.usage_count > 0}
              title={
                asset.usage_count
                  ? "Choose another model for the resources using it first."
                  : undefined
              }
              onClick={async () => {
                try {
                  await remove(current).unwrap();
                  notify.success(`“${asset.name}” deleted`);
                  onDeleted();
                } catch (failure) {
                  notify.error("Unable to delete the model", {
                    description: getApiErrorMessage(failure, "Please try again."),
                  });
                }
              }}
            >
              Delete
            </Button>
          </Space>
          {asset.usage_count > 0 && (
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              In use. Choose another model for those resources before deleting it.
            </Typography.Paragraph>
          )}
        </Form>
        <div>
          <ModelPreview
            key={assetCacheKey(asset)}
            model={preview}
            height={460}
            onError={() => setPreviewFailed(true)}
          />
          {previewFailed && (
            <Typography.Text type="danger">
              This model could not render. Upload a corrected GLB and select it instead.
            </Typography.Text>
          )}
        </div>
      </div>
    </Card>
  );
}

type ModelGroup = "all" | "embedded" | "furniture" | "it" | "custom";

function classifyModelGroup(asset: VisualModelAsset): Exclude<ModelGroup, "all"> {
  const name = asset.name.toLowerCase();
  if (!name.startsWith("reference")) return "custom";
  if (
    /oscilloscope|power supply|jtag|debugger|logic|dev board|dut|hil|solder|rework|chamber|rf|spectrum|instrument|vector|vn1630|vn5620|vt system|lauterbach|trace32|powerdebug|segger|j-link|raspberry|stm32|nucleo|ecu|rigol|dp831|toellner|toe\s?89|itech|electronic load|waveform|keysight|fluke|multimeter|microscope|embedded test rack/.test(
      name,
    )
  ) {
    return "embedded";
  }
  if (
    /workbench|workstation|cabinet|shelving|cart|fume|hood|stool|chair|drawer|gantry|cable/.test(
      name,
    )
  ) {
    return "furniture";
  }
  return "it";
}

function LibraryTab({ assets }: { assets: VisualModelAsset[] }) {
  const [selected, setSelected] = useState<number>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ModelGroup>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((item) => {
      if (group !== "all" && classifyModelGroup(item) !== group) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, group, query]);

  const asset = filtered.find((item) => item.id === selected) ?? filtered[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
      <Card
        size="small"
        title={`Library (${filtered.length})`}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            Upload
          </Button>
        }
      >
        <Space direction="vertical" size="small" style={{ width: "100%", marginBottom: 10 }}>
          <Input.Search
            allowClear
            size="small"
            placeholder="Filter 3D models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Segmented
            block
            size="small"
            value={group}
            onChange={(val) => setGroup(val as ModelGroup)}
            options={[
              { label: "All", value: "all" },
              { label: "Embedded", value: "embedded" },
              { label: "Furniture", value: "furniture" },
              { label: "IT", value: "it" },
              { label: "Custom", value: "custom" },
            ]}
          />
        </Space>
        <List
          aria-label="Library models"
          style={{ maxHeight: 520, overflowY: "auto" }}
          dataSource={filtered}
          locale={{ emptyText: assets.length ? "No matching models" : "No models yet" }}
          renderItem={(item) => (
            <List.Item
              onClick={() => setSelected(item.id)}
              style={{
                cursor: "pointer",
                paddingInline: 8,
                borderRadius: 6,
                background: item.id === asset?.id ? "var(--ant-color-primary-bg, #e6f4ff)" : undefined,
              }}
            >
              <List.Item.Meta
                title={item.name}
                description={`${size(item.size)} · used by ${item.usage_count}`}
              />
            </List.Item>
          )}
        />
      </Card>
      {asset ? (
        <AssetDetail key={asset.id} asset={asset} onDeleted={() => setSelected(undefined)} />
      ) : (
        <Card>
          <Empty description={assets.length ? "No models match this filter." : "Upload a GLB to start the library."}>
            {!assets.length && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
                Upload a model
              </Button>
            )}
          </Empty>
        </Card>
      )}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(created) => {
          setUploadOpen(false);
          setSelected(created.id);
        }}
      />
    </div>
  );
}

const CATALOGS: { value: ModelSegment; label: string; help: string }[] = [
  {
    value: "station-types",
    label: "Station types",
    help: "Stations of this type show the model unless the station has its own.",
  },
  {
    value: "equipment-product-models",
    label: "Product models",
    help: "Devices of this product model show it unless the device has its own.",
  },
  {
    value: "equipment-categories",
    label: "Equipment categories",
    help: "Devices show their category's model when neither the device nor its product model has one.",
  },
];

function CatalogDefaultsTab({ assets }: { assets: VisualModelAsset[] }) {
  const [catalog, setCatalog] = useState<ModelSegment>("station-types");
  const rows = useVisualModelSelectionsQuery(catalog);
  const [select] = useSelectVisualModelMutation();
  const [saving, setSaving] = useState<number>();
  const options = assets.map((asset) => ({ label: asset.name, value: asset.id }));
  const info = CATALOGS.find((item) => item.value === catalog)!;

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Segmented
          value={catalog}
          options={CATALOGS.map(({ value, label }) => ({ value, label }))}
          onChange={(value) => setCatalog(value as ModelSegment)}
        />
        <Typography.Text type="secondary">{info.help}</Typography.Text>
        <Table<VisualModelSelection>
          rowKey="id"
          size="middle"
          loading={rows.isFetching}
          dataSource={rows.data ?? []}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          columns={[
            { title: "Name", dataIndex: "name" },
            {
              title: "Default 3D model",
              key: "model",
              width: 360,
              render: (_, row) => (
                <Select
                  aria-label={`3D model for ${row.name}`}
                  style={{ width: "100%" }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="None"
                  value={row.visual_model_id ?? undefined}
                  options={options}
                  loading={saving === row.id}
                  disabled={saving === row.id}
                  onChange={async (value) => {
                    setSaving(row.id);
                    try {
                      await select({
                        segment: catalog,
                        id: row.id,
                        visualModelId: value ?? null,
                      }).unwrap();
                    } catch (failure) {
                      notify.error("Unable to save the default model", {
                        description: getApiErrorMessage(failure, "Please try again."),
                      });
                    } finally {
                      setSaving(undefined);
                    }
                  }}
                />
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

export default function VisualModelsPage() {
  const assets = useVisualModelAssetsQuery();
  const list = assets.data ?? [];
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          3D models
        </Typography.Title>
        <Typography.Text type="secondary">
          Upload a GLB once and reuse it. Choose a station's, bench's or device's model in its own edit
          form; set catalog defaults here. The 3D dashboard only displays them.
        </Typography.Text>
      </div>
      {assets.isError ? (
        <Card>
          <Empty description="Cannot load the 3D model library.">
            <Button onClick={() => assets.refetch()}>Retry</Button>
          </Empty>
        </Card>
      ) : (
        <Tabs
          items={[
            {
              key: "library",
              label: `Library (${list.length})`,
              children: assets.isLoading ? <Card loading /> : <LibraryTab assets={list} />,
            },
            {
              key: "defaults",
              label: "Catalog defaults",
              children: <CatalogDefaultsTab assets={list} />,
            },
          ]}
        />
      )}
    </Space>
  );
}
