// src/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './auth/dto/register-user.dto';
import { LoginUserDto } from './auth/dto/login-user.dto';

@Controller('auth') // Base route for this controller is /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint for user registration.
   * Handles POST requests to /auth/register.
   * Uses RegisterUserDto for request body validation.
   */
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    // Validation is handled automatically by ValidationPipe + RegisterUserDto
    console.log('CONTROLLER: Registering user:', registerUserDto.email);
    // Delegate user creation and password hashing to the service
    // The service returns the user object without the password hash
    return this.authService.register(registerUserDto);
  }

  /**
   * Endpoint for user login.
   * Handles POST requests to /auth/login.
   * Uses LoginUserDto for request body validation.
   * Returns a JWT access token upon successful login.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Set standard HTTP status for successful login to 200 OK
  async login(@Body() loginUserDto: LoginUserDto) {
    // Validation of email/password format handled by ValidationPipe + LoginUserDto
    console.log('CONTROLLER: Login attempt for:', loginUserDto.email);

    // 1. Validate user credentials using the AuthService helper
    const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);

    // 2. If validation fails (wrong email or password), throw an error
    if (!user) {
      console.log('CONTROLLER: Login failed - Invalid credentials for:', loginUserDto.email);
      throw new UnauthorizedException('Invalid credentials'); // Standard 401 error
    }

    // 3. If validation succeeds, generate and return the JWT access token
    console.log('CONTROLLER: Login successful for:', loginUserDto.email);
    // The login service method takes the validated user object (without password)
    return this.authService.login(user);
  }

  // TODO: Add endpoints for password reset, email verification etc. if needed later.
  // TODO: Add an endpoint (e.g., GET /auth/profile) protected by JwtAuthGuard
  //       to test token authentication and retrieve logged-in user info.
}
