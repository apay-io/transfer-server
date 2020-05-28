import { existsSync, readFileSync } from 'fs';

export default {
  appName: 'apay.io',
  companyInfo: existsSync(process.cwd() + '/config/stellar.toml')
    ? readFileSync(process.cwd() + '/config/stellar.toml') : '',
  notificationSecrets: [
    process.env.NOTIFICATION_SECRET,
  ],
};
