import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import { db } from '../db/client';

// Mock all dependencies
jest.mock('../db/client', () => ({
  db: {
    execute: jest.fn(),
  },
}));

jest.mock('../routes/user.routes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/mock-user', (req: any, res: any) => res.json({ route: 'user' }));
  return { default: router };
});

jest.mock('../routes/team.routes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/mock-team', (req: any, res: any) => res.json({ route: 'team' }));
  return { default: router };
});

jest.mock('../routes/clock.routes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/mock-clock', (req: any, res: any) => res.json({ route: 'clock' }));
  return { default: router };
});

describe('Express Server', () => {
  let app: Express;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Recreate the Express app for each test
    app = express();

    // Import routes after mocking
    const userRouter = require('../routes/user.routes').default;
    const teamRouter = require('../routes/team.routes').default;
    const clockRouter = require('../routes/clock.routes').default;

    // Apply middlewares
    app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }));
    app.use(express.json());

    // Apply routes
    app.use(userRouter);
    app.use(teamRouter);
    app.use(clockRouter);

    // Add root route
    app.get('/', (req, res) => {
      res.json({ message: 'Hello World!' });
    });

    // Add health check route
    app.get('/health', async (req, res) => {
      try {
        await db.execute('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
      } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'error', database: 'disconnected', error: error });
      }
    });
  });

  describe('GET /', () => {
    it('should return Hello World message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello World!' });
    });
  });

  describe('GET /health', () => {
    it('should return ok status when database is connected', async () => {
      (db.execute as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        database: 'connected',
      });
      expect(db.execute).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return error status when database is disconnected', async () => {
      const dbError = new Error('Database connection failed');
      (db.execute as jest.Mock).mockRejectedValue(dbError);

      const response = await request(app).get('/health');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        database: 'disconnected',
        error: {},
      });
    });
  });

  describe('Middleware configuration', () => {
    it('should parse JSON bodies', async () => {
      app.post('/test-json', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: { test: 'data' } });
    });

    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Router integration', () => {
    it('should mount user router', async () => {
      const response = await request(app).get('/mock-user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'user' });
    });

    it('should mount team router', async () => {
      const response = await request(app).get('/mock-team');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'team' });
    });

    it('should mount clock router', async () => {
      const response = await request(app).get('/mock-clock');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ route: 'clock' });
    });
  });
});
