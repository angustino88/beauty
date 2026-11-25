import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Read the search term a link put in the URL (`?q=`). */
export function readUrlSearch(params: URLSearchParams): string {
  return params.get('q') ?? '';
}

/**
 * Search box state seeded from the URL, so links such as `/lab-equipment/computing?q=COMP-01`
 * open the list already filtered. A later link to the same page (no remount) updates it too.
 * Typing does not rewrite the URL.
 */
export function useUrlSearch() {
  const [params] = useSearchParams();
  const fromUrl = readUrlSearch(params);
  const [search, setSearch] = useState(fromUrl);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(fromUrl);
  }, [fromUrl]);
  return [search, setSearch] as const;
}
