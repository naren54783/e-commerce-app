import express, { Application } from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

const app: Application = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(requestLogger);

app.use('/api', userRoutes);
app.use('/api', productRoutes);

app.use(errorHandler);

export default app;
