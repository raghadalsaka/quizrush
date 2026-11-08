export function turnQueue(count: number, activeIndex: number): number[] {
  const start = count > 0 && activeIndex >= 0 && activeIndex < count ? activeIndex : 0
  return Array.from({ length: count }, (_, offset) => (start + offset) % count)
}
