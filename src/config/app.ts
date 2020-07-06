import { existsSync, readFileSync } from 'fs';
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appName: 'apay.io',
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  companyInfo: existsSync(process.cwd() + '/config/stellar.toml')
    ? readFileSync(process.cwd() + '/config/stellar.toml') : '',
  notificationSecrets: [
    process.env.NOTIFICATION_SECRET,
  ],
}));
