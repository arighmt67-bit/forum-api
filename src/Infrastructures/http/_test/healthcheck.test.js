import request from 'supertest';
import container from '../../container.js';
import createServer from '../createServer.js';
import pool from '../../database/postgres/pool.js';

/**
 * Memastikan server membalas 404 untuk route yang tidak terdaftar.
 */
describe('Health check endpoint', () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should response 200 and status success when accessing root path', async () => {
    const response = await request(server).get('/');

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('success');
    expect(response.body.message).toEqual('Forum API is running');
  });

  it('should response 200 and database up when accessing /health', async () => {
    const response = await request(server).get('/health');

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('success');
    expect(response.body.database).toEqual('up');
  });

  it('should response 503 when database is unreachable', async () => {
    const spy = vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('db down'));

    const response = await request(server).get('/health');

    expect(response.status).toEqual(503);
    expect(response.body.database).toEqual('down');
    spy.mockRestore();
  });

  it('should response 404 for unregistered route', async () => {
    const response = await request(server).get('/unregistered-route');

    expect(response.status).toEqual(404);
    expect(response.body.status).toEqual('fail');
  });
});
