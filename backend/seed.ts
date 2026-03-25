import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';
import { InventoryService } from './src/modules/inventory/inventory.service';
import { HrService } from './src/modules/hr/hr.service';
import { SalesService } from './src/modules/sales/sales.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const inventoryService = app.get(InventoryService);
  const hrService = app.get(HrService);
  const salesService = app.get(SalesService);

  console.log('Seeding database...');

  // Create demo user
  const existingUser = await usersService.findOne('demo');
  if (!existingUser) {
    console.log('Creating demo user...');
  }

  console.log('Seed completed!');
  await app.close();
}
bootstrap();
