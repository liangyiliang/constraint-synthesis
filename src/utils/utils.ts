export function cartesianProduct<T>(lists: T[][]): T[][] {
  if (lists.length === 0) {
    return [];
  }
  return lists.reduce<T[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
    [[]]
  );
}
