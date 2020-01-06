import {existsSync, readFileSync} from 'fs';
import { AssetInterface } from '../interfaces/asset.interface';
const file = process.cwd() + '/assets.json';

const jsonConfig = JSON.parse(existsSync(file)
    ? readFileSync(file, 'utf8')
    : readFileSync(file + '.example', 'utf8'));

export default {
  raw: jsonConfig,
  getAssetConfig: (assetCode: string): AssetInterface => {
    return jsonConfig.find((item) => item.code === assetCode);
  },
};
