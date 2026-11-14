type WithId = { id: number | string };

/**
 * Generates granular cache tags for list queries.
 * Handles new BE response envelope: { total_count, data: T[] }
 * Also accepts plain T[] for flexibility.
 */
export function generateListTags<TagType extends string, T extends WithId>(
  type: TagType,
  result: { data?: T[] } | T[] | undefined,
): { type: TagType; id: number | string }[] {
  const items = Array.isArray(result) ? result : (result?.data ?? []);
  return [
    ...items.map(({ id }) => ({ type, id })),
    { type, id: 'LIST' },
  ];
}

export const generateItemTag = <TagType extends string>(type: TagType, id: number | string): { type: TagType; id: number | string }[] =>
  [{ type, id }];

export const invalidateList = <TagType extends string>(type: TagType): { type: TagType; id: string }[] =>
  [{ type, id: 'LIST' }];

export const invalidateItem = <TagType extends string>(type: TagType, id: number | string): { type: TagType; id: number | string }[] =>
  [{ type, id }, { type, id: 'LIST' }];
