    // src/auth/dto/register-user.dto.ts
    import { IsString, IsEmail, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

    // Ensure 'export' keyword is present
    export class RegisterUserDto {
      @IsEmail()
      @IsNotEmpty()
      email: string;

      @IsString()
      @MinLength(8, { message: 'Password must be at least 8 characters long' })
      @IsNotEmpty()
      password: string;

      @IsString()
      @IsOptional()
      name?: string;
    }
    