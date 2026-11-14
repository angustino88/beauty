export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export function requireApiFields<T>() {
  return <K extends keyof T>(value: RequiredKeys<T, K>): RequiredKeys<T, K> => value;
}

export function mapApiResponse<TOutput>() {
  return <TInput,>(mapper: (input: TInput) => TOutput) => mapper;
}