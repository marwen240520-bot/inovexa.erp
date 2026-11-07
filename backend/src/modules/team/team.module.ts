import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { PermissionsService, TEAM_ROLES, ROLES, PERMISSIONS } from '../auth/permissions.service';
import { assertStrongPassword } from '../auth/auth.service';
import { MailService } from '../../common/mail/mail.service';

class MemberDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsIn(TEAM_ROLES as unknown as string[]) role: string;
  @IsOptional() @IsString() @MaxLength(128) password?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsString({ each: true }) extraPermissions?: string[];
}

class MemberPatchDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsIn(TEAM_ROLES as unknown as string[]) role?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsString({ each: true }) extraPermissions?: string[];
}

const safe = (u: User) => ({
  id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone, isActive: u.isActive,
  twoFactorEnabled: u.twoFactorEnabled, extraPermissions: u.extraPermissions || [], lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
});

const PERMISSION_FORMAT = /^-?([a-z_]+|\*)(:([a-z_]+|\*))?$/;

/**
 * Équipe : le PROPRIÉTAIRE du compte invite des collaborateurs qui travaillent sur les mêmes données avec des droits limités.
 * Réservé au propriétaire (la ressource « team » n'est accordée à aucun rôle d'équipe).
 */
@ApiTags('Équipe')
@ApiBearerAuth()
@Controller('team')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class TeamController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly permissions: PermissionsService,
    private readonly mail: MailService,
  ) {}

  private assertOwner(req: any) {
    if (req.user.isTeamMember) throw new BadRequestException('Seul le propriétaire du compte gère l’équipe.');
  }

  private cleanPermissions(list?: string[]) {
    if (!list) return undefined;
    for (const p of list) if (!PERMISSION_FORMAT.test(p)) throw new BadRequestException(`Droit invalide : « ${p} » (format ressource:action, ex. documents:validate).`);
    return Array.from(new Set(list));
  }

  private async member(ownerId: number, id: number) {
    const u = await this.users.findOne({ where: { id, ownerId } });
    if (!u) throw new NotFoundException('Membre introuvable');
    return u;
  }

  @Get('roles') @ApiOperation({ summary: 'Rôles disponibles et droits de chacun' })
  roles() {
    return {
      roles: TEAM_ROLES.map((r) => ({ role: r, permissions: this.permissions.getRolePermissions(r) })),
      resources: PERMISSIONS.RESOURCES,
      actions: PERMISSIONS.ACTIONS,
      note: 'Chaque rôle peut être ajusté par membre avec extraPermissions (ex. "documents:validate" pour ajouter, "-documents:delete" pour retirer).',
    };
  }

  @Get('members') @ApiOperation({ summary: 'Membres de l’équipe' })
  async list(@Request() req: any) {
    this.assertOwner(req);
    const rows = await this.users.find({ where: { ownerId: req.user.userId }, order: { createdAt: 'ASC' } });
    return rows.map(safe);
  }

  @Post('members') @ApiOperation({ summary: 'Invite un collaborateur (mot de passe provisoire généré si absent)' })
  async create(@Request() req: any, @Body() dto: MemberDto) {
    this.assertOwner(req);
    const email = dto.email.trim().toLowerCase();
    if (await this.users.createQueryBuilder('u').where('LOWER(u.email) = :e', { e: email }).getOne()) throw new ConflictException('Cet email est déjà utilisé.');
    const generated = !dto.password;
    const password = dto.password || `${randomBytes(6).toString('base64url')}-${Math.floor(10 + Math.random() * 90)}`;
    assertStrongPassword(password);
    const owner = await this.users.findOne({ where: { id: req.user.userId } });
    const user = await this.users.save(this.users.create({
      email, name: dto.name.trim(), phone: dto.phone || null, role: dto.role, isActive: true, ownerId: req.user.userId,
      companyName: owner?.companyName || null, password: await bcrypt.hash(password, 10), extraPermissions: this.cleanPermissions(dto.extraPermissions) || null,
    } as any) as unknown as User);

    const emailed = await this.mail.trySend({
      to: email,
      subject: `Invitation à rejoindre ${owner?.companyName || 'Inovexa ERP'}`,
      text: `Bonjour ${user.name},\n\nVous avez été invité(e) sur Inovexa ERP (${owner?.companyName || ''}) avec le rôle « ${user.role} ».\nIdentifiant : ${email}\nMot de passe provisoire : ${password}\n\nChangez-le dès votre première connexion.`,
    });
    return { ...safe(user), temporaryPassword: generated || !emailed ? password : undefined, invitationEmailed: emailed };
  }

  @Patch('members/:id')
  async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: MemberPatchDto) {
    this.assertOwner(req);
    const u = await this.member(req.user.userId, id);
    if (dto.name !== undefined) u.name = dto.name.trim();
    if (dto.role !== undefined) u.role = dto.role;
    if (dto.isActive !== undefined) {
      u.isActive = dto.isActive;
      if (!dto.isActive) u.tokenVersion = (u.tokenVersion ?? 0) + 1; // coupe ses sessions immédiatement
    }
    if (dto.extraPermissions !== undefined) u.extraPermissions = this.cleanPermissions(dto.extraPermissions) || null;
    return safe(await this.users.save(u));
  }

  @Post('members/:id/reset-password') @ApiOperation({ summary: 'Génère un nouveau mot de passe provisoire (affiché une seule fois)' })
  async resetPassword(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    this.assertOwner(req);
    const u = await this.member(req.user.userId, id);
    const password = `${randomBytes(6).toString('base64url')}-${Math.floor(10 + Math.random() * 90)}`;
    u.password = await bcrypt.hash(password, 10);
    u.tokenVersion = (u.tokenVersion ?? 0) + 1;
    await this.users.save(u);
    return { id: u.id, temporaryPassword: password };
  }

  @Post('members/:id/reset-2fa') @ApiOperation({ summary: 'Désactive la double authentification d’un membre qui a perdu son téléphone' })
  async reset2fa(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    this.assertOwner(req);
    const u = await this.member(req.user.userId, id);
    u.twoFactorEnabled = false;
    u.twoFactorSecret = null;
    await this.users.save(u);
    return { id: u.id, twoFactorEnabled: false };
  }

  @Delete('members/:id') @ApiOperation({ summary: 'Retire un membre (compte désactivé, historique conservé)' })
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    this.assertOwner(req);
    const u = await this.member(req.user.userId, id);
    u.isActive = false;
    u.tokenVersion = (u.tokenVersion ?? 0) + 1;
    await this.users.save(u);
    return { success: true };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [TeamController],
})
export class TeamModule {}
