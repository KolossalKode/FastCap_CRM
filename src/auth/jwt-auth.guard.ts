    // src/auth/jwt-auth.guard.ts
    import { Injectable } from '@nestjs/common';
    import { AuthGuard } from '@nestjs/passport';

    /**
     * A guard that uses the 'jwt' strategy defined in JwtStrategy.
     * Apply this guard to controllers or specific routes using @UseGuards(JwtAuthGuard)
     * to ensure the request has a valid JWT Bearer token.
     */
    @Injectable()
    export class JwtAuthGuard extends AuthGuard('jwt') {} // 'jwt' refers to the default strategy registered in AuthModule
    