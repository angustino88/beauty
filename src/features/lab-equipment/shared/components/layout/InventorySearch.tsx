import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InventorySearchProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
}

/** Preserve submit-on-Enter/button and immediate-clear semantics of FullTextSearch. */
export function InventorySearch({ value, onSearch, placeholder }: InventorySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form role="search" className="tw:flex tw:w-full tw:min-w-0 tw:items-center tw:gap-2" onSubmit={(event) => {
      event.preventDefault();
      onSearch(inputRef.current?.value ?? '');
    }}>
      <div className="tw:relative tw:min-w-0 tw:flex-1">
        <Search aria-hidden="true" className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-2.5 tw:size-4 tw:text-muted-foreground" />
        <Input ref={inputRef} key={value} defaultValue={value} placeholder={placeholder} aria-label={placeholder} className="tw:pl-9 tw:pr-9" onChange={(event) => {
          if (event.target.value === '') onSearch('');
        }} />
        <Button variant="ghost" size="icon" className="tw:absolute tw:right-1 tw:top-1 tw:size-7" aria-label="Clear search" onClick={() => {
          if (inputRef.current) inputRef.current.value = '';
          onSearch('');
          inputRef.current?.focus();
        }}><X className="tw:size-3.5" /></Button>
      </div>
      <Button type="submit" variant="outline">Search</Button>
    </form>
  );
}