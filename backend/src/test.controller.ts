// test.controller.ts - Endpoint de test
import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  hello() {
    return { message: 'API fonctionne correctement', timestamp: new Date().toISOString() };
  }
}
