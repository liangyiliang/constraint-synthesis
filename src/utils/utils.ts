export function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce(
    (acc, curr) => {
      const result: T[][] = [];
      for (const a of acc) {
        for (const b of curr) {
          result.push([...a, b]);
        }
      }
      return result;
    },
    [[]] as T[][]
  );
}
