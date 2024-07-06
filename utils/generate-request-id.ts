export function generateRequestId() {
  return Math.ceil(100000000 + Math.random() * 800000000);
}