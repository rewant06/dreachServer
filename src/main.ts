import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'], // Allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: false, // Allow cookies/auth headers
    // allowedHeaders: 'Content-Type, Accept', // Allowed headers
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
