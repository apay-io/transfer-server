import {existsSync, readFileSync} from 'fs';
import { AssetInterface } from '../interfaces/asset.interface';
import { registerAs } from '@nestjs/config';
const file = process.cwd() + '/config/assets.json';

const jsonConfig = JSON.parse(existsSync(file)
    ? readFileSync(file, 'utf8')
    : readFileSync(process.cwd() + '/assets.json.example', 'utf8'));

export default registerAs('assets', () => ({
  raw: jsonConfig,
  getAssetConfig: (assetCode: string): AssetInterface => {
    return jsonConfig.find((item) => item.code === assetCode);
  },
}));
