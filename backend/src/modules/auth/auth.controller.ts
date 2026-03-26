import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { email: string; password: string; firstName: string; lastName: string }) {
    try {
      const result = await this.authService.register(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
      );
      return result;
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message,
        error: 'Bad Request',
      };
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.login(body.email, body.password);
      return result;
    } catch (error) {
      return {
        statusCode: 401,
        message: error.message,
        error: 'Unauthorized',
      };
    }
  }
}
