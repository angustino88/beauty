import { SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { useRef } from 'react';

interface FullTextSearchProps {
  /** Controlled value from parent — used to sync when parent resets (e.g. clearAllFilters) */
  value: string;
  /** Called only on Search button click or Enter — NOT on every keystroke */
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FullTextSearch({ value, onSearch, placeholder, className }: FullTextSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const readInputValue = () => inputRef.current?.value ?? '';

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: '100%', minWidth: 0 }}>
      <div className="full-text-search-input" style={{ flex: '1 1 0', minWidth: 0 }}>
        <Input
          ref={(node) => {
            inputRef.current = node?.input ?? null;
          }}
          key={value}
          defaultValue={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') onSearch('');
          }}
          onPressEnter={() => onSearch(readInputValue())}
          allowClear
          placeholder={placeholder ?? 'Search'}
          aria-label={placeholder ?? 'Search'}
        />
      </div>
      <div className="full-text-search-action" style={{ flex: '0 0 auto' }}>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => onSearch(readInputValue())}
          aria-label="Search"
        >
          Search
        </Button>
      </div>
    </div>
  );
}
