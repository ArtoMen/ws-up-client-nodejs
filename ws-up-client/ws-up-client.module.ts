import { Module } from "ws-up";
import { ConnectionConfig } from "../core/types";
import { ModuleWithProviders } from "ws-up/core/types";
import { WsUpClientService } from "./ws-up-client.service";
import { connectionConfigToken } from "../core/injection-tokens";

@Module({
  providers: [
    WsUpClientService,
  ],
  exports: [
    WsUpClientService,
  ]
})
export class WsUpClientModule {
  static forRoot(config: ConnectionConfig): ModuleWithProviders {
    return {
      wsupModule: WsUpClientModule,
      providers: [
        {
          provide: connectionConfigToken,
          useValue: config
        }
      ]
    }
  }
}