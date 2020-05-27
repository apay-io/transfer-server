import {readFileSync} from 'fs';

export default {
  appName: 'apay.io',
  companyInfo: readFileSync(process.cwd() + '/config/stellar.toml'),
  notificationSecrets: [
    process.env.NOTIFICATION_SECRET,
  ],
};
