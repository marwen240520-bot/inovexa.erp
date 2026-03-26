import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Inovexa AI ERP API')
    .setDescription('API complète pour la gestion d\'entreprise')
    .setVersion('1.0')
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('clients', 'Gestion des clients')
    .addTag('products', 'Gestion des produits')
    .addTag('invoices', 'Gestion des factures')
    .addTag('orders', 'Gestion des commandes')
    .addTag('employees', 'Gestion des employés')
    .addTag('suppliers', 'Gestion des fournisseurs')
    .addTag('quotes', 'Gestion des devis')
    .addTag('warehouses', 'Gestion des dépôts')
    .addTag('payroll', 'Gestion des paies')
    .addTag('ai', 'Intelligence Artificielle')
    .addTag('analytics', 'Analytics')
    .addTag('search', 'Recherche')
    .addTag('export', 'Export données')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
