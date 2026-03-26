import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConstraintsAndIndexes implements MigrationInterface {
    name = 'AddConstraintsAndIndexes';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Index pour performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customerId)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(productId)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(createdAt)`);
        
        // Contraintes d'intégrité
        await queryRunner.query(`ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT`);
        await queryRunner.query(`ALTER TABLE invoices ADD CONSTRAINT fk_invoices_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_customer_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_movements_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_movements_date`);
        
        await queryRunner.query(`ALTER TABLE orders DROP CONSTRAINT fk_orders_customer`);
        await queryRunner.query(`ALTER TABLE order_items DROP CONSTRAINT fk_order_items_order`);
        await queryRunner.query(`ALTER TABLE order_items DROP CONSTRAINT fk_order_items_product`);
        await queryRunner.query(`ALTER TABLE invoices DROP CONSTRAINT fk_invoices_order`);
        await queryRunner.query(`ALTER TABLE stock_movements DROP CONSTRAINT fk_stock_movements_product`);
    }
}
