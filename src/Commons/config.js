/* istanbul ignore file */
import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({
    path: path.resolve(process.cwd(), '.test.env'),
  });
} else {
  dotenv.config();
}

const config = {
  app: {
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    port: process.env.PORT,
    debug: process.env.NODE_ENV === 'development' ? { request: ['error'] } : {},
  },
  database: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },
  auth: {
    jwtStrategy: 'forumapi',
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    /**
     * Starter project resmi menuliskan ACCCESS_TOKEN_AGE (tiga huruf C),
     * sedangkan penulisan yang lazim adalah ACCESS_TOKEN_AGE. Keduanya
     * diterima agar konfigurasi tetap terbaca apa pun ejaan yang dipakai.
     */
    accessTokenAge: process.env.ACCESS_TOKEN_AGE || process.env.ACCCESS_TOKEN_AGE,
  },
};

export default config;