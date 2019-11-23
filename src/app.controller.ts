import {Controller, Get, Header, Req} from '@nestjs/common';
import { AppService } from './app.service';
import {ConfigService, InjectConfig} from "nestjs-config";
import {AssetInterface} from "./interfaces/asset.interface";

@Controller()
export class AppController {
  constructor(
      @InjectConfig()
      private readonly config: ConfigService,
      private readonly appService: AppService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('.well-known/stellar.toml')
  @Header('Content-Type', 'text/plain')
  getStellarToml(@Req() req): string {
    let text = `TRANSFER_SERVER="${req.headers.host}"\n\n`;
    this.config.get('assets').forEach((item: AssetInterface) => {
      text += `[[CURRENCIES]]\ncode="${item.code}"\n`;
      for (let [key, value] of Object.entries(item.stellar)) {
        text += `${key}=` + (typeof value === "string" ? `"${value}"` : value) + `\n`;
      }
    });
    return text;
  }
}
