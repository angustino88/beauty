const KEY = 'lm:hasSession';

export const sessionFlag = {
  set: (): void => localStorage.setItem(KEY, '1'),
  clear: (): void => localStorage.removeItem(KEY),
  exists: (): boolean => localStorage.getItem(KEY) === '1',
};