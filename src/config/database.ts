import * as fs from 'fs';
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.TYPEORM_TYPE || 'postgres',
  url: process.env.TYPEORM_URL || process.env.DATABASE_URL ,
  host: process.env.TYPEORM_HOST,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  ssl: process.env.TYPEORM_SSL ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./config/postgres.crt').toString(),
  } : null,
  database: process.env.TYPEORM_DATABASE,
  port: parseInt(process.env.TYPEORM_PORT, 10),
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: (process.env.TYPEORM_ENTITIES || 'dist/**/**.entity{.ts,.js}').split(';'),
  migrationsRun: (process.env.TYPEORM_MIGRATIONS_RUN || 'true') === 'true',
  synchronize: (process.env.TYPEORM_SYNCHRONIZE || 'true') === 'true',
  extra: process.env.TYPEORM_SOCKET ? {host: process.env.TYPEORM_SOCKET} : null,
}));
