import { useRef } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Form, Input, type InputRef } from 'antd';
import {
  QUICK_DURATION_PRESETS,
  getSmartUnitSuggestions,
  parseSmartDuration,
  type DurationOption,
} from '../workDuration';
import styles from './SupportTickets.module.css';

interface SmartDurationInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onPressEnter?: () => void;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
  'aria-required'?: boolean | 'false' | 'true';
}

function formatBreakdownSummary(parsed: Extract<ReturnType<typeof parseSmartDuration>, { ok: true }>): string {
  const prefix = parsed.rounded ? '≈ ' : '= ';
  const minutesText = `${parsed.minutes.toLocaleString()} min`;
  let base: string;
  if (parsed.breakdown !== parsed.hoursLabel) {
    base = `${prefix}${parsed.breakdown} · ${parsed.hoursLabel} (${minutesText})`;
  } else if (parsed.minutes >= 60) {
    base = `${prefix}${parsed.hoursLabel} (${minutesText})`;
  } else {
    base = `${prefix}${parsed.minutes} ${parsed.minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return parsed.rounded ? `${base} · rounded` : base;
}

export function SmartDurationInput({
  id,
  value = '',
  onChange,
  onBlur,
  onPressEnter,
  disabled,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}: SmartDurationInputProps) {
  const inputRef = useRef<InputRef>(null);
  const { status } = Form.Item.useStatus();
  const parsed = parseSmartDuration(value);
  const suggestions = getSmartUnitSuggestions(value);
  const usingSuggestions = suggestions.length > 0;
  const options: readonly DurationOption[] = usingSuggestions ? suggestions : QUICK_DURATION_PRESETS;

  const applyOption = (option: DurationOption) => {
    if (disabled) return;
    onChange?.(option.value);
    inputRef.current?.focus({ cursor: 'end' });
  };

  return (
    <div className={styles.smartDuration}>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        disabled={disabled}
        status={status}
        autoComplete="off"
        allowClear
        placeholder="e.g. 45m, 1h 30m, 2d, 1w, 1mo"
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        prefix={<ClockCircleOutlined className={styles.durationInputIcon} />}
        suffix={
          parsed.ok ? (
            <span className={styles.durationSuffixPill} title={`${parsed.minutes.toLocaleString()} minutes`}>
              {parsed.rounded ? '≈ ' : ''}
              {parsed.hoursLabel}
            </span>
          ) : null
        }
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        onPressEnter={onPressEnter}
      />

      <div className={styles.durationChipRow} role="group" aria-label={usingSuggestions ? 'Unit suggestions' : 'Quick duration presets'}>
        {usingSuggestions && <span className={styles.durationChipLabel}>Unit:</span>}
        {options.map((option) => {
          const isActive = parsed.ok && parsed.minutes === option.minutes && !usingSuggestions;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={usingSuggestions ? undefined : isActive}
              className={isActive ? `${styles.durationChip} ${styles.durationChipActive}` : styles.durationChip}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyOption(option)}
            >
              <span>{option.label}</span>
              {option.hint && <span className={styles.durationChipHint}>{option.hint}</span>}
            </button>
          );
        })}
      </div>

      <div className={styles.durationMetaRow} aria-live="polite">
        {parsed.ok ? (
          <span className={styles.durationBreakdown}>{formatBreakdownSummary(parsed)}</span>
        ) : !value.trim() ? (
          <span className={styles.durationHint}>Work time: 1d = 8h · 1w = 5d · 1mo = 4w (max 240h)</span>
        ) : parsed.code === 'bare_decimal' ? (
          <span className={styles.durationHint}>Pick a unit above or type h, d, w, or mo</span>
        ) : parsed.code === 'too_large' && status !== 'error' ? (
          <span className={styles.durationWarning}>{parsed.message}</span>
        ) : null}
      </div>
    </div>
  );
}
