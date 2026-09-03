import request from 'supertest';
import container from '../../container.js';
import createServer from '../createServer.js';
import pool from '../../database/postgres/pool.js';

/**
 * Berkas ini sengaja memuat ekspektasi yang keliru untuk memperagakan
 * skenario Continuous Integration yang GAGAL. Setelah proses CI gagal
 * tercatat, ekspektasi diperbaiki pada pull request berikutnya.
 */
describe('Health check endpoint', () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should response 404 for unregistered route', async () => {
    const response = await request(server).get('/unregistered-route');

    // Ekspektasi keliru yang disengaja: seharusnya 404, bukan 200.
    expect(response.status).toEqual(200);
  });
});
