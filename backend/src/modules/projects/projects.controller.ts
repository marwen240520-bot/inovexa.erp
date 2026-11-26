import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@ApiTags('Projets')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Projets de la société, avec le nombre de tâches (total, terminées, en retard)' })
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.userId);
  }

  @Get('tasks/late')
  @ApiOperation({ summary: 'Tâches non terminées dont l’échéance est passée' })
  lateTasks(@Request() req: any) {
    return this.projectsService.lateTasks(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Un projet et ses tâches' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.projectsService.create(req.user.userId, body || {});
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: any) {
    return this.projectsService.update(id, req.user.userId, body || {});
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.projectsService.delete(id, req.user.userId);
  }

  @Post(':id/tasks')
  addTask(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: any) {
    return this.projectsService.addTask(id, req.user.userId, body || {});
  }

  @Patch(':id/tasks/:taskId')
  updateTask(@Param('id', ParseIntPipe) id: number, @Param('taskId', ParseIntPipe) taskId: number, @Request() req: any, @Body() body: any) {
    return this.projectsService.updateTask(id, taskId, req.user.userId, body || {});
  }

  @Delete(':id/tasks/:taskId')
  deleteTask(@Param('id', ParseIntPipe) id: number, @Param('taskId', ParseIntPipe) taskId: number, @Request() req: any) {
    return this.projectsService.deleteTask(id, taskId, req.user.userId);
  }
}
