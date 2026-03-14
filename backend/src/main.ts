import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Prefix
  app.setGlobalPrefix('api');

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('APP_URL', 'http://localhost:5173'),
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Redis & Session Setup
  const redisClient = createClient({
    socket: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    },
  });

  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis. Cannot start application.', err);
    process.exit(1);
  }

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'session:',
  });

  const sessionSecret = configService.get<string>('SESSION_SECRET');
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  app.use(
    session({
      name: 'sourcico_sid',
      store: redisStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      },
    }),
  );

  // Graceful Shutdown (The "Grateful Kill")
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Backend is running on: http://localhost:${port}/api`);
}

bootstrap();