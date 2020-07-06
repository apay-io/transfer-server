import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS || 'redis://:@transfer-server-redis:6379'
}));
