import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'client' })
  role: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true, default: {} })
  modules: Record<string, boolean>;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @Column({ default: true })
  isActive: boolean;

  // Membre d'équipe : id du compte propriétaire dont il utilise les données (null = propriétaire / administrateur).
  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  // Droits supplémentaires accordés à ce membre en plus de son rôle (ex. ['documents:validate']).
  @Column({ type: 'jsonb', nullable: true })
  extraPermissions: string[] | null;

  // Authentification à deux facteurs (TOTP).
  @Column({ type: 'varchar', length: 80, nullable: true })
  twoFactorSecret: string | null;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  // Réinitialisation du mot de passe : on ne stocke que l'empreinte du lien envoyé par email.
  @Column({ type: 'varchar', length: 64, nullable: true })
  passwordResetHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  // Incrémenté pour déconnecter toutes les sessions (changement de mot de passe, « se déconnecter partout »).
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
