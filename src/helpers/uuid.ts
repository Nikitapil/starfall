export function createUuid(): string {
  return (Math.random() + Date.now()).toString();
}
