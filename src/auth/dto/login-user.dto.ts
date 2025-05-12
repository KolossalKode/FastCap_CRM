    // src/auth/dto/login-user.dto.ts
    import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

    // Ensure 'export' keyword is present
    export class LoginUserDto {
      @IsEmail()
      @IsNotEmpty()
      email: string;

      @IsString()
      @IsNotEmpty()
      password: string;
    }
    