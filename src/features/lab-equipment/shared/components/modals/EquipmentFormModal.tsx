/**
 * Generic create/edit modal for all Lab Equipment pages.
 * Driven by a FieldConfig[] array — each page provides its own field definitions.
 */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from 'react';
import {
    Form, Input, InputNumber, Select, Collapse,
    DatePicker, Upload, Row, Col, Spin,
} from 'antd';
import { confirmAction, getApiErrorDetails, getApiErrorMessage, notify } from '@/shared/notifications';
import { InboxOutlined } from '@ant-design/icons';
import { FormDialog } from '@/components/ui/form-dialog';
import type { RcFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import { isEquipmentErrorNotified } from '../../utils/equipmentNotifications';
import { parseFormApiError } from '../../utils/formApiError';
import { buildRequiredFieldRules } from '../../utils/formValidation';
import { RESOURCE_IMAGE_ACCEPT, validateResourceImage } from '@/shared/lib/api/resourceImage';
import styles from './EquipmentFormModal.module.css';

/* ─── Types ──────────────────────────────────────────────────── */

export type FieldType =
    | 'text' | 'number' | 'select' | 'multi-select'
    | 'date' | 'quarter' | 'textarea' | 'image';

export interface SelectOptionLeaf {
    label: React.ReactNode;
    value: string | number;
    title?: string;
    /** Resource options (toResourceOption): short text for the closed select, and the text search matches. */
    selectedLabel?: string;
    searchText?: string;
}
export interface SelectOptionGroup {
    label: React.ReactNode;
    title?: string;
    options: SelectOptionLeaf[];
}
export type SelectFieldOption = SelectOptionLeaf | SelectOptionGroup;

export interface FieldConfig {
    name:            string;
    /** Optional backend API field key when the form field name differs (e.g. max_power -> power_capacity_w). */
    apiField?:       string;
    label:           string;
    type:            FieldType;
    required?:       boolean;
    /** Show prominently without making an optional backend field mandatory. */
    essential?:      boolean;
    maxLength?:      number;
    options?:        SelectFieldOption[];
    /** Shown in an empty server-searched select, e.g. "Type to search". */
    searchHint?:     React.ReactNode;
    onSearch?:       (query: string) => void;
    /** Server-searched selects: called when the dropdown opens (e.g. to load the first page). */
    onOpenChange?:   (open: boolean) => void;
    /** Server-searched selects: a request is in flight. */
    loading?:        boolean;
    /** Server-searched selects: load the next page when the list is scrolled to its end. */
    onPopupScroll?:  React.UIEventHandler<HTMLDivElement>;
    /** Shown under the options, e.g. "50 of 340 shown · scroll down for more". */
    popupHint?:      React.ReactNode;
    placeholder?:    string;
    disabled?:       boolean;
    disabledInEdit?: boolean;
    creatable?:      boolean;
    help?:           React.ReactNode;
    span?:           number;
    /** Dynamic options computed from current form values — used for dependent selects (e.g. Unit depends on Room) */
    optionsFn?:      (formValues: Record<string, unknown>) => SelectFieldOption[];
    /** Explicit parent field names that must be selected before this field can be used */
    dependsOn?:      string[];
    section?:        string;
}

export interface EquipmentFormModalProps {
    open:            boolean;
    mode:            'create' | 'edit';
    title:           string;
    fields:          FieldConfig[];
    initialValues?:  Record<string, unknown> | object;
    onSubmit:        (values: Record<string, unknown>, imageFile?: File | null) => Promise<void>;
    onCancel:        () => void;
    onValuesChange?: (values: Record<string, unknown>) => void;
    loading?:        boolean;
    professionalForm?: boolean;
}

type SelectLikeValue = string | number;
type UnknownRecord   = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSelectLikeValue = (value: unknown): SelectLikeValue | undefined => {
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (!isRecord(value)) return undefined;
    const directCandidates = [value.id, value.value, value.pk];
    for (const candidate of directCandidates) {
        if (typeof candidate === 'string' || typeof candidate === 'number') return candidate;
    }
    for (const [key, candidate] of Object.entries(value)) {
        if (key.endsWith('_id') && (typeof candidate === 'string' || typeof candidate === 'number')) {
            return candidate;
        }
    }
    return undefined;
};

/** Resource options carry a one-line `selectedLabel` for the closed select (their list label has two lines). */
const resourceSelectProps = (options?: SelectFieldOption[]) =>
    options?.some((option) => 'selectedLabel' in option && option.selectedLabel)
        ? { optionLabelProp: 'selectedLabel' as const }
        : {};

interface FormFieldsProps {
    fields: FieldConfig[];
    form: ReturnType<typeof Form.useForm>[0];
    mode: 'create' | 'edit';
    professionalForm: boolean;
}

function FormFields({ fields, form, mode, professionalForm }: FormFieldsProps) {
    const renderField = (field: FieldConfig) => {
        const disabled = Boolean(field.disabled) || (Boolean(field.disabledInEdit) && mode === 'edit')
            || Boolean(field.dependsOn?.some((parent) => form.getFieldValue(parent) == null));

        switch (field.type) {
            case 'text':
                return <Input placeholder={field.placeholder ?? `Enter ${field.label}`} disabled={disabled} maxLength={field.maxLength} />;
            case 'number':
                return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} disabled={disabled} />;
            case 'select':
                return <Select showSearch allowClear placeholder={field.placeholder ?? `Select ${field.label}`}
                    disabled={disabled} onSearch={field.onSearch}
                    filterOption={field.onSearch ? false : filterResourceOption}
                    loading={field.loading}
                    notFoundContent={field.loading ? <Spin size="small" /> : field.searchHint}
                    options={field.options} {...resourceSelectProps(field.options)}
                    {...(field.creatable ? { mode: 'tags', tokenSeparators: [','] } : {})}
                />;
            case 'multi-select':
                return <Select mode="multiple" showSearch allowClear placeholder={field.placeholder ?? `Select ${field.label}`}
                    disabled={disabled} options={field.options} onSearch={field.onSearch}
                    onOpenChange={field.onOpenChange} onPopupScroll={field.onPopupScroll} loading={field.loading}
                    notFoundContent={field.loading ? <Spin size="small" /> : field.searchHint}
                    popupRender={field.popupHint ? (menu) => (
                        <>
                            {menu}
                            <div className={styles.popupHint}>{field.popupHint}</div>
                        </>
                    ) : undefined}
                    {...resourceSelectProps(field.options)}
                    // With a search callback the options come from the server, so do not filter them again here.
                    filterOption={field.onSearch ? false : filterResourceOption}
                />;
            case 'date':
                return <DatePicker style={{ width: '100%' }} disabled={disabled} />;
            case 'quarter':
                return <DatePicker picker="quarter" style={{ width: '100%' }} disabled={disabled} />;
            case 'textarea':
                return <Input.TextArea autoSize={{ minRows: professionalForm ? 2 : 4, maxRows: 6 }}
                    placeholder={field.placeholder ?? `Enter ${field.label}`} disabled={disabled} />;
            default:
                return <Input />;
        }
    };

    return (
        <Row gutter={[12, 8]}>
            {fields.map((field) => (
                <Col key={field.name} xs={24} sm={field.span ?? (field.type === 'textarea' ? 24 : 12)}>
                    {field.optionsFn ? (
                        <Form.Item noStyle shouldUpdate={(prev, next) =>
                            field.dependsOn?.some((parent) => prev[parent] !== next[parent]) ?? true
                        }>
                            {() => {
                                const values = form.getFieldsValue(true) as Record<string, unknown>;
                                const options = field.optionsFn!(values);
                                const disabled = Boolean(field.disabled) || (Boolean(field.disabledInEdit) && mode === 'edit')
                                    || options.length === 0 || Boolean(field.dependsOn?.some((parent) => values[parent] == null));
                                return (
                                    <Form.Item name={field.name} label={field.label} required={field.required} extra={field.help}
                                        rules={field.required ? [{ required: true, message: `Please select ${field.label}` }] : []}>
                                        <Select showSearch allowClear
                                            placeholder={options.length ? `Select ${field.label}` : (field.placeholder ?? 'Select a parent field first')}
                                            disabled={disabled} options={options} {...resourceSelectProps(options)}
                                            filterOption={filterResourceOption}
                                        />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                    ) : (
                        <Form.Item name={field.name} label={field.label} required={field.required} extra={field.help}
                            rules={[
                                ...buildRequiredFieldRules(field),
                                ...(field.maxLength ? [{ max: field.maxLength, message: `${field.label} must be at most ${field.maxLength} characters` }] : []),
                            ]}>
                            {renderField(field)}
                        </Form.Item>
                    )}
                </Col>
            ))}
        </Row>
    );
}

function FormSection({ section, fields, form, mode, professionalForm }: FormFieldsProps & { section: string }) {
    return (
        <section className={styles.section}>
            <h3>{section}</h3>
            <FormFields fields={fields.filter((field) => (field.section ?? 'Identification') === section)}
                form={form} mode={mode} professionalForm={professionalForm} />
        </section>
    );
}

/* ─── Component ──────────────────────────────────────────────── */

export default function EquipmentFormModal({
    open, mode, title, fields, initialValues,
    onSubmit, onCancel, loading = false,
    onValuesChange,
    professionalForm = false,
}: EquipmentFormModalProps) {
    const [form]         = Form.useForm();
    const [imageFile,     setImageFile]     = useState<File | null>(null);
    const [imagePreview,  setImagePreview]  = useState<string | null>(null);
    const [imageRemoved,  setImageRemoved]  = useState(false);
    const hadImageRef = useRef(false);
    const [submitting,    setSubmitting]    = useState(false);
    const [detailsOpen,   setDetailsOpen]   = useState(false);
    const initialized = useRef<{ mode: string; recordId: unknown } | null>(null);
    const fieldsRef = useRef(fields);
    const valuesChangeRef = useRef(onValuesChange);
    useEffect(() => {
        fieldsRef.current = fields;
        valuesChangeRef.current = onValuesChange;
    }, [fields, onValuesChange]);
    const previewUrl = useRef<string | null>(null);
    useEffect(() => () => {
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    }, []);

    useEffect(() => {
        if (!open) {
            initialized.current = null;
            return;
        }
        const recordId = mode === 'edit' ? (initialValues as { id?: unknown } | undefined)?.id : undefined;
        if (initialized.current?.mode === mode && initialized.current.recordId === recordId) return;
        initialized.current = { mode, recordId };
        if (open) {
            form.resetFields();
            setImageFile(null);
            setImageRemoved(false);
            hadImageRef.current = mode === 'edit' && Boolean((initialValues as { image?: unknown } | undefined)?.image);
            setDetailsOpen(mode === 'edit');
            if (mode === 'edit' && initialValues) {
                const record = initialValues as Record<string, unknown>;
                const formValues: Record<string, unknown> = {};
                for (const field of fieldsRef.current) {
                    const raw = record[field.name];
                    if (field.type === 'date' || field.type === 'quarter') {
                        formValues[field.name] = raw ? dayjs(raw as string) : null;
                    } else if (field.type === 'select') {
                        formValues[field.name] = normalizeSelectLikeValue(raw) ?? undefined;
                    } else if (field.type === 'multi-select' && Array.isArray(raw)) {
                        formValues[field.name] = raw
                            .map((item) => normalizeSelectLikeValue(item))
                            .filter((item): item is SelectLikeValue => item !== undefined);
                    } else {
                        formValues[field.name] = raw ?? undefined;
                    }
                }
                form.setFieldsValue(formValues);
                valuesChangeRef.current?.(formValues);
                setImagePreview((record.image as string) || null);
            } else {
                setImagePreview(null);
                valuesChangeRef.current?.({});
            }
        }
    }, [open, mode, initialValues, form, professionalForm]);

    const handleOk = async () => {
        let submittedValues: Record<string, unknown> | undefined;
        try {
            const values = await form.validateFields();
            submittedValues = { ...values };
            setSubmitting(true);
            for (const field of fields) {
                if ((field.type === 'date' || field.type === 'quarter') && values[field.name]) {
                    values[field.name] = dayjs(values[field.name]).format(
                        field.type === 'quarter' ? 'YYYY-[Q]Q' : 'YYYY-MM-DD',
                    );
                }
            }
            // File = upload, null = remove the existing image, undefined = unchanged.
            await onSubmit(values, imageFile ?? (imageRemoved ? null : undefined));
            form.resetFields();
            setImageFile(null);
            setImageRemoved(false);
            setImagePreview(null);
        } catch (err) {
            if (submittedValues) {
                form.setFieldsValue(submittedValues);
            }
            if (err && typeof err === 'object' && 'errorFields' in err) {
                const validationError = err as { errorFields: Array<{ name: Array<string | number> }> };
                if (validationError.errorFields.some(({ name }) => name[0] && !fields.find((field) => field.name === name[0])?.required)) {
                    setDetailsOpen(true);
                }
                const firstField = validationError.errorFields[0]?.name;
                if (firstField) requestAnimationFrame(() => form.scrollToField(firstField, { block: 'center', focus: true }));
                notify.warning('Please review the highlighted fields', {
                    description: 'Complete all required fields before saving.',
                });
            } else {
                const parsed = parseFormApiError(err);
                const apiToFormName = new Map<string, string>();
                const fieldLabels: Record<string, string> = {};
                for (const field of fields) {
                    apiToFormName.set(field.name, field.name);
                    fieldLabels[field.name] = field.label;
                    if (field.apiField) {
                        apiToFormName.set(field.apiField, field.name);
                        fieldLabels[field.apiField] = field.label;
                    }
                }
                if (parsed) {
                    const matched = Object.entries(parsed.fieldErrors)
                        .map(([name, errors]): [string, string[]] | null => {
                            const formName = apiToFormName.get(name);
                            return formName ? [formName, errors] : null;
                        })
                        .filter((entry): entry is [string, string[]] => entry !== null);
                    if (matched.length > 0) {
                        setDetailsOpen(true);
                        form.setFields(matched.map(([name, errors]) => ({ name, errors })));
                        const first = matched[0][0];
                        form.scrollToField(first, { block: 'center' });
                        (form as unknown as { getFieldInstance?: (n: string) => { focus?: () => void } })
                            .getFieldInstance?.(first)?.focus?.();
                    }
                }
                if (!isEquipmentErrorNotified(err)) {
                    const details = getApiErrorDetails(err, { fieldLabels });
                    notify.error('Unable to save changes', {
                        description: getApiErrorMessage(err, 'Please review your entries and try again.', { fieldLabels }),
                        details: details.length > 0 ? details : undefined,
                    });
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleFormValuesChange = (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => {
        const changed = new Set(Object.keys(changedValues));
        let shouldNotifyParent = changed.has('kind_id')
            || changed.has('type_id')
            || changed.has('manufacturer_id')
            || changed.has('product_model_id')
            || changed.has('department_id')
            // Any parent of a dependent field (e.g. room_id → slot_id, setup_location_id → station_slot_id):
            // the page loads the child's options from it, so it must hear about the change.
            || fields.some((field) => field.dependsOn?.some((parent) => changed.has(parent)));
        let expanded = true;
        while (expanded) {
            expanded = false;
            for (const field of fields) {
                if (changed.has(field.name) || !field.dependsOn?.some((parent) => changed.has(parent))) continue;
                changed.add(field.name);
                form.setFieldValue(field.name, undefined);
                if (field.name === 'kind_id' || field.name === 'type_id'
                    || field.name === 'manufacturer_id' || field.name === 'product_model_id') {
                    shouldNotifyParent = true;
                }
                expanded = true;
            }
        }
        if (changed.has('room')) form.setFieldValue('slot_code', undefined);

        // Auto-calculate setup_capacity from rows × cols (Room)
        if (changed.has('rows') || changed.has('cols')) {
            const hasRows = fields.some((field) => field.name === 'rows');
            const hasCols = fields.some((field) => field.name === 'cols');
            const hasCapacity = fields.some((field) => field.name === 'setup_capacity');
            if (hasRows && hasCols && hasCapacity) {
                const rows = Number(allValues.rows);
                const cols = Number(allValues.cols);
                form.setFieldValue('setup_capacity', Number.isFinite(rows) && Number.isFinite(cols) && rows > 0 && cols > 0
                    ? rows * cols : undefined);
            }
        }
        if (shouldNotifyParent) {
            onValuesChange?.(form.getFieldsValue(true) as Record<string, unknown>);
        }
    };

    const handleImageChange = (file: RcFile) => {
        const problem = validateResourceImage(file);
        if (problem) {
            notify.warning('Invalid image file', { description: problem });
            return Upload.LIST_IGNORE;
        }
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = URL.createObjectURL(file);
        setImageFile(file);
        setImageRemoved(false);
        setImagePreview(previewUrl.current);
        return false;
    };

    const regularFields = fields.filter((f) => f.type !== 'image');
    const essentialFields = regularFields.filter((field) => field.required || field.essential);
    const detailFields = regularFields.filter((field) => !field.required && !field.essential);
    const hasImage      = fields.some((f) => f.type === 'image');
    const primarySections = professionalForm
        ? [...new Set(regularFields.filter((field) => field.required || field.essential).map((field) => field.section ?? 'Identification'))]
        : [];
    const additionalSections = professionalForm
        ? [...new Set(regularFields.filter((field) => !primarySections.includes(field.section ?? 'Identification')).map((field) => field.section ?? 'Identification'))]
        : [];
    return (
        <FormDialog
            className={professionalForm ? styles.modal : undefined}
            title={title}
            description={mode === 'create' ? 'Add a new resource. Required fields are marked with an asterisk.' : 'Update resource information. Changes are saved only when you confirm.'}
            open={open}
            onSubmit={handleOk}
            onCancel={() => {
                if (form.isFieldsTouched()) {
                    confirmAction({
                        title: 'Discard unsaved changes?',
                        description: 'Closing this form will discard all unsaved entries.',
                        confirmText: 'Discard',
                        cancelText: 'Continue editing',
                        variant: 'danger',
                        onConfirm: onCancel,
                    });
                } else {
                    onCancel();
                }
            }}
            busy={loading || submitting}
            wide
            submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
        >
            <Form
                form={form}
                layout="vertical"
                className={professionalForm ? styles.form : undefined}
                onValuesChange={handleFormValuesChange}
                style={{
                    maxHeight: '70vh', overflowY: 'auto',
                    scrollbarWidth: 'thin', overflowX: 'hidden', padding: '0 10px',
                }}
            >
                {professionalForm ? primarySections.map((section) => (
                    <FormSection key={section} section={section} fields={regularFields}
                        form={form} mode={mode} professionalForm={professionalForm} />
                )) : essentialFields.length > 0 && (
                    <FormFields fields={essentialFields} form={form} mode={mode} professionalForm={professionalForm} />
                )}

                {(professionalForm ? additionalSections.length > 0 : detailFields.length > 0) && (
                    <Collapse
                        className="equipment-form-details"
                        activeKey={detailsOpen ? ['details'] : []}
                        onChange={(keys) => setDetailsOpen(keys.includes('details'))}
                    >
                        <Collapse.Panel key="details" header={professionalForm ? 'Lifecycle, licenses & additional details' : 'Additional details'} forceRender>
                            {professionalForm ? additionalSections.map((section) => (
                                <FormSection key={section} section={section} fields={regularFields}
                                    form={form} mode={mode} professionalForm={professionalForm} />
                            )) : <FormFields fields={detailFields} form={form} mode={mode} professionalForm={professionalForm} />}
                        </Collapse.Panel>
                    </Collapse>
                )}

                {hasImage && (
                    <Row>
                        <Col span={24}>
                            <Form.Item label="Image (optional)">
                                <Upload.Dragger
                                    beforeUpload={(file) => handleImageChange(file as RcFile)}
                                    multiple={false} maxCount={1}
                                    fileList={imagePreview
                                        ? [{ uid: '-1', name: 'image', status: 'done' as const, url: imagePreview }]
                                        : undefined
                                    }
                                    onRemove={() => { setImageFile(null); setImagePreview(null); setImageRemoved(hadImageRef.current); }}
                                    accept={RESOURCE_IMAGE_ACCEPT}
                                >
                                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                    <p className="ant-upload-text">Choose or drop an image</p>
                                    <p className="ant-upload-hint">JPG, PNG, GIF or WEBP · Up to 5 MB</p>
                                </Upload.Dragger>
                            </Form.Item>
                        </Col>
                    </Row>
                )}
            </Form>
        </FormDialog>
    );
}