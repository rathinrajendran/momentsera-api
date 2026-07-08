export function deepMerge(target: any, source: any): any {
  if (
    typeof target !== "object" ||
    typeof source !== "object" ||
    !target ||
    !source
  ) {
    return source;
  }

  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}
