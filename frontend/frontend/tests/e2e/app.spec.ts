import { test, expect } from '@playwright/test';

test.describe('Inovexa-AI ERP - Tests E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Page de login doit s\'afficher', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Inovexa-AI');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Inscription utilisateur', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL(/.*register/);
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'User');
    await page.fill('input[type="email"]', 	est@test.com);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Connexion utilisateur', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Navigation vers Factures', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    await page.click('text=Finance');
    await expect(page).toHaveURL(/.*finance/);
    await expect(page.locator('h1')).toContainText('Factures');
  });

  test('Création de facture', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    await page.click('text=Finance');
    await page.click('text=Nouvelle facture');
    await page.fill('input[name="invoice_number"]', 'FACT-001');
    await page.fill('input[name="total"]', '1000');
    await page.click('button[type="submit"]');
    await expect(page.locator('.toast')).toContainText('Facture créée');
  });

  test('Recherche globale', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    await page.fill('input[placeholder*="Rechercher"]', 'facture');
    await page.waitForTimeout(1000);
    await expect(page.locator('.search-results')).toBeVisible();
  });
});
