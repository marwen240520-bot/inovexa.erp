describe('Authentication', () => {
  it('should login with valid credentials', () => {
    cy.visit('/auth/login');
    cy.get('input[type="email"]').type('marwen2405@gmail.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/clients');
  });
});

describe('Dashboard', () => {
  it('should display dashboard statistics', () => {
    cy.visit('/dashboard');
    cy.contains('Chiffre d\'affaires').should('be.visible');
  });
});
