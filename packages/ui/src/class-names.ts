/** Joins class names, skipping empty values (CSS Module lookups are typed `string | undefined`). */
export function classNames(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter((name): name is string => typeof name === 'string' && name !== '').join(' ');
}
