import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import pino from 'pino';

import { env } from './config/env';
import { apiLimiter } from './middlewares/rateLimit';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug'
});

export const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'Shopora API', version: '1.0.0' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
