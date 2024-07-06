export type ConnectionConfig = {
  url: string;
  requestTimeout?: number;
  reconnectTimeout?: number;
  connectionCallback?: () => void;
}