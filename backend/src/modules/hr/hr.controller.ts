import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { HrService } from './hr.service';
import { Employee } from './entities/employee.entity';
import { Leave } from './entities/leave.entity';

@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}

  @Get('employees')
  findAllEmployees() {
    return this.hrService.findAllEmployees();
  }

  @Get('employees/:id')
  findEmployeeById(@Param('id') id: string) {
    return this.hrService.findEmployeeById(id);
  }

  @Post('employees')
  createEmployee(@Body() data: Partial<Employee>) {
    return this.hrService.createEmployee(data);
  }

  @Put('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() data: Partial<Employee>) {
    return this.hrService.updateEmployee(id, data);
  }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  @Post('leaves')
  createLeave(@Body() data: Partial<Leave>) {
    return this.hrService.createLeaveRequest(data);
  }

  @Get('dashboard')
  getDashboard() {
    return this.hrService.getHrStats();
  }
}
