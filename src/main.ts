    // src/main.ts

    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { PrismaService } from './prisma.service';
    import { ValidationPipe } from '@nestjs/common'; // <-- 1. Import ValidationPipe

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      // --- Enable Global Validation ---
      app.useGlobalPipes(new ValidationPipe({ // <-- 2. Add this block
          whitelist: true, // Automatically remove properties without decorators
          forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are received
          transform: true, // Automatically transform payloads to DTO instances
          transformOptions: {
              enableImplicitConversion: true, // Allow basic type conversions (e.g., string query param to number)
          },
      }));

      // --- Prisma Shutdown Hooks Setup ---
      const prismaService = app.get(PrismaService);
      await prismaService.enableShutdownHooks(app);

      // --- Optional: Add global prefix ---
      // app.setGlobalPrefix('api');

      // --- Start Listening ---
      await app.listen(process.env.PORT ?? 3000);
      console.log(`Application is running on: ${await app.getUrl()}`);
    }
    bootstrap();
    