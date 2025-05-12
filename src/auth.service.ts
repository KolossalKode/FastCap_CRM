    // src/auth.service.ts
    import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
    import { PrismaService } from './prisma.service'; // Adjust path if needed
    import { RegisterUserDto } from './auth/dto/register-user.dto'; // Corrected path
    import { LoginUserDto } from './auth/dto/login-user.dto'; // Corrected path
    import { User, Prisma } from '@prisma/client';
    import * as bcrypt from 'bcrypt';
    import { JwtService } from '@nestjs/jwt';
    import { v4 as uuidv4 } from 'uuid';

    @Injectable()
    export class AuthService {
      constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
      ) {}

      // --- Registration Method ---
      async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password'>> {
        const { email, password, name } = registerUserDto;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userId = uuidv4();

        try {
          const user = await this.prisma.user.create({
            data: {
              id: userId,
              email: email.toLowerCase(),
              password: hashedPassword,
              name: name,
            },
          });
          const { password: _, ...result } = user;
          return result;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictException('Email already exists');
          }
          console.error("Error during user registration:", error);
          throw new InternalServerErrorException('Could not register user.');
        }
      }

      // --- Validation Method ---
      async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
        const user = await this.prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (user && await bcrypt.compare(pass, user.password)) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }

      // --- Login Method (JWT Generation) ---
      async login(user: Omit<User, 'password'>) {
        const payload = { email: user.email, sub: user.id, role: user.role, name: user.name };
        return {
          access_token: this.jwtService.sign(payload),
          user: payload
        };
      }
    }
    