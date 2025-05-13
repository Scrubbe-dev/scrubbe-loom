import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/config';
import { logger } from './utils/logger';
import { router } from './routes';
import { errorHandler } from './middlewares/errorHandler';
// config()
export const app = express();


app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});


app.use('/api', router);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});


app.use(errorHandler);