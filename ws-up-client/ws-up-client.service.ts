import { Injectable } from "ws-up/DI";
import { Inject } from "ws-up/DI/inject-decorator";
import { generateRequestId } from "../utils";
import { ConnectionConfig } from "../core/types";
import { WebSocket } from "ws";
import { connectionConfigToken } from "../core/injection-tokens";

@Injectable()
export class WsUpClientService {
  #ws!: WebSocket;
  #requests: Map<number, { id: number; resolveFunction: (result: any) => void; timeoutId: NodeJS.Timeout; }> = new Map();

  constructor(@Inject(connectionConfigToken) private config: ConnectionConfig) {
    this.#createClient();
  }

  #createClient() {
    this.#ws = new WebSocket(this.config.url);

    if (this.config.connectionCallback) {
      this.#ws.on('open', this.config.connectionCallback);
    }

    this.#ws.on('close', () => {
      console.log(`Disconnected! Try to reconnect in ${this.config.reconnectTimeout ?? 5000}ms ...`);
      this.#ws.removeAllListeners();
      setTimeout(() => {
        this.#createClient();
      }, this.config.reconnectTimeout ?? 5000);
    });

    this.#ws.on('error', () => {
      console.log(`Error! Try to reconnect in ${this.config.reconnectTimeout ?? 5000}ms ...`);
      this.#ws.removeAllListeners();
      setTimeout(() => {
        this.#createClient();
      }, this.config.reconnectTimeout ?? 5000);
    });

    this.#ws.on('message', (messageRaw) => {
      this.#getMessage(messageRaw.toString('utf-8'));
    })
  }

  sendRequest<T>(path: string, body: {body?: any; props?: any}): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = generateRequestId();
      this.#ws.send(JSON.stringify({
        method: path,
        body: body.body,
        props: body.props,
        requestId: id
      }));

      this.#requests.set(id, {
        id,
        resolveFunction: resolve,
        timeoutId: setTimeout(() => {
          reject({message: 'Request timeout', code: 408});
        }, this.config.requestTimeout ?? 10000)
      });
    });
  }

  #getMessage(messageRaw: string) {
    try {
      const json: {method: string; body: any;} = JSON.parse(messageRaw);
      if (json.method.includes('RESPONSE')) {
        const reverseMethod = json.method.split('').reverse().join('');
        const requestId = reverseMethod.substring(0, reverseMethod.indexOf('/')).split('').reverse().join('');

        const requestInfo = this.#requests.get(Number(requestId));
        if (requestInfo) {
          clearTimeout(requestInfo.timeoutId);
          requestInfo.resolveFunction(json.body);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}