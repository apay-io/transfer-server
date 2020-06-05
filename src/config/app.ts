import { existsSync, readFileSync } from 'fs';
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appName: 'apay.io',
  companyInfo: existsSync(process.cwd() + '/config/stellar.toml')
    ? readFileSync(process.cwd() + '/config/stellar.toml') : '',
  notificationSecrets: [
    process.env.NOTIFICATION_SECRET,
  ],
}));
