// src/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import the JwtStrategy we created
import { JwtStrategy } from './jwt.strategy'; // <-- Import JwtStrategy

@Module({
  imports: [
    // Import ConfigModule to read .env variables
    ConfigModule.forRoot({
       isGlobal: true, // Make ConfigModule global
    }),
    // Setup Passport with JWT as the default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Setup JWT Module asynchronously to use ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Make ConfigService available
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Read secret from .env
        signOptions: { expiresIn: '1h' }, // Token expiration time (e.g., 1 hour)
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    // PrismaModule is already Global, so no need to import here
  ],
  controllers: [AuthController],
  // Provide AuthService AND JwtStrategy
  providers: [AuthService, JwtStrategy], // <-- Add JwtStrategy here
  // Export PassportModule and JwtModule if needed by other modules (optional here)
  // exports: [PassportModule, JwtModule],
})
export class AuthModule {}
