// src/jwt.strategy.ts
import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt'; // Import StrategyOptions
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service'; // Adjust path if needed
import { User } from '@prisma/client';

// Define the shape of the payload extracted from the JWT
interface JwtPayload {
  sub: string; // Standard JWT property for subject (usually user ID)
  email: string;
  role: string;
  name?: string;
  // Add other fields you included in the AuthService login payload
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Explicitly get the secret first
    const secret = configService.get<string>('JWT_SECRET');

    // Throw an error during initialization if the secret is missing
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET environment variable is not set.');
    }

    // Define the options object explicitly with the correct type
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Pass the definite string secret
      passReqToCallback: false, // <-- Explicitly set to false
    };

    // Pass the explicitly defined options object to super()
    super(strategyOptions);
  }

  // This method is called by Passport AFTER it verifies the token signature and expiration
  // The 'payload' argument is the decoded JSON object from the JWT
  async validate(payload: JwtPayload): Promise<Omit<User, 'password'>> {
    console.log('JWT Payload Received in Strategy:', payload);

    // Validate user existence
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }, // 'sub' should contain the user ID
    });

    if (!user) {
      console.warn(`JWT validation failed: User with ID ${payload.sub} not found.`);
      throw new UnauthorizedException('User not found or invalid token.');
    }

    // Exclude password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
