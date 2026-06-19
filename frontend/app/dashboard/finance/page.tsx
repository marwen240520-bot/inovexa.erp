"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, RadialLinearScale
);

// ==================== TRADUCTIONS COMPLÈTES ====================
const translations = {
  fr: {
    common: {
      dashboard: "Tableau de bord",
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      add: "Ajouter",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
      refresh: "Actualiser",
      sync: "Synchroniser",
      actions: "Actions",
      status: "Statut",
      date: "Date",
      amount: "Montant",
      total: "Total",
      paid: "Payé",
      pending: "En attente",
      yes: "Oui",
      no: "Non",
      all: "Tous",
      error: "Erreur",
      success: "Succès",
      noData: "Aucune donnée",
      year: "Exercice",
      lastUpdate: "MAJ",
      cashAlert: "Alerte trésorerie",
      margin: "marge",
      forecast: "Projetée",
      invoicesPending: "factures impayées",
      currentAssets: "Actif circulant",
      fixedAssets: "Actif immobilisé",
      currentLiabilities: "Dettes CT",
      longTermLiabilities: "Dettes LT",
      equity: "Capitaux propres",
      cogs: "Achats et stocks (COGS)",
      depreciation: "Amortissements",
      interestExpense: "Intérêts",
      incomeTax: "Impôts (25%)",
      monthlyEvolution: "Évolution mensuelle",
      assets: "Actif",
      inventory: "Stocks",
      totalAssets: "TOTAL ACTIF",
      liabilities: "Passif",
      taxLiabilities: "Dettes fiscales & sociales",
      totalLiabilities: "Total dettes",
      capital: "Capital",
      reserves: "Réserves",
      currentYearResult: "Résultat exercice",
      balanceSheetStructure: "Structure du bilan",
      currentBalance: "Solde actuel",
      monthlyCashflow: "Flux de trésorerie mensuels",
      sixMonthForecast: "Projection 6 mois",
      byCategory: "Par catégorie",
      byFamily: "Par famille",
      transactions: "Transactions",
      supplier: "Fournisseur",
      paymentMethod: "Moyen de paiement",
      reference: "Référence",
      client: "Client",
      dueDate: "Échéance",
      delay: "Retard",
      unpaidInvoices: "Factures impayées",
      agingSchedule: "Échéancier client",
      customerInvoices: "Factures client",
      budgetVsActual: "Budget vs Réel",
      departmentPerformance: "Performance par département",
      performanceRadar: "Radar de performance",
      amountExcludingTax: "Montant HT",
      accountName: "Nom du compte",
      initialBalance: "Solde initial",
      situation: "Situation",
      paymentTerm: "Délai client",
      topClients: "Top 5 clients",
      topProducts: "Top 5 produits",
      detailedProfitEvolution: "Évolution détaillée du résultat",
      expenseDistribution: "Répartition des dépenses",
      actual: "Réel",
      budget: "Budget",
      performance: "Performance",
      target: "Cible",
      category: "Catégorie",
      description: "Description",
      supplier_label: "Fournisseur",
      date_label: "Date",
      accountsPayable: "Dettes fournisseurs",
      current: "À échoir",
      debtToEquity: "Endettement",
      debtToEquityDesc: "Dettes / Capitaux propres",
      currentRatioDesc: "Capacité à payer les dettes CT",
      quickRatioDesc: "Ratio hors stocks",
      netMarginDesc: "Rentabilité nette %",
      roiDesc: "Retour sur investissement",
      roeDesc: "Retour sur capitaux propres",
      cash: "Liquidités",
      card: "Carte bancaire",
      transfer: "Virement",
      check: "Chèque",
      online: "Paiement en ligne",
      checking: "Compte courant",
      savings: "Compte épargne",
      netMargin: "Marge nette",
      ebit: "EBIT",
      amountHT: "Montant HT",
      vat: "TVA",
      amountIncVat: "Montant TTC",
      quarter: "Trimestre",
      currentQuarter: "Trimestre en cours",
      cashIn: "Entrées d'argent",
      cashOut: "Sorties d'argent",
      netCash: "Flux net",
      excellent: "Excellent",
      good: "Bon",
      warning: "Attention",
      critical: "Critique",
      healthy: "Sain",
      okay: "Acceptable",
      profitable: "Bénéficiaire",
      loss: "Déficitaire",
      healthScore: "Score santé",
      roiLong: "Retour sur investissement",
      roeLong: "Retour sur capitaux propres",
      ebitda: "EBITDA",
      ebitLong: "Résultat d'exploitation",
      ebt: "Résultat avant impôts",
      quickRatio: "Ratio rapide",
      roe: "ROE",
      days: "j",
      monthPlus: "M+",
      quarterShort: "T",
      yearCurrent: "Année en cours",
      confirmDelete: "Confirmer la suppression ?",
      confirmBulkDelete: "Confirmer la suppression de {count} élément(s) ?",
      fillAmountAndCategory: "Veuillez remplir le montant et la catégorie",
      fillAmount: "Veuillez remplir le montant",
      fillAccountName: "Veuillez remplir le nom du compte",
      expenseAdded: "Dépense ajoutée",
      budgetSaved: "Budget enregistré",
      accountAdded: "Compte bancaire ajouté",
      expenseDeleted: "Dépense supprimée",
      expenses: "Dépenses",
      other: "Autres",
      overdue: "Créances échues",
      value: "Valeur"
    },
    finance: {
      title: "Module Finance",
      subtitle: "Comptabilité · Trésorerie · Analyse · Budgets · Fiscalité",
      revenue: "Chiffre d'affaires",
      profit: "Bénéfice net",
      cashBalance: "Trésorerie",
      ebitda: "EBITDA",
      accountsReceivable: "Créances clients",
      accountsPayable: "Dettes fournisseurs",
      equity: "Capitaux propres",
      roi: "ROI global",
      grossMargin: "Marge brute",
      currentRatio: "Ratio liquidité",
      overdue: "Créances échues",
      dashboard: "Tableau de bord",
      income: "Compte de résultat",
      balance: "Bilan comptable",
      cashflow: "Trésorerie",
      expenses: "Dépenses",
      invoices: "Factures",
      budget: "Budget",
      ratios: "Ratios & KPIs",
      cashIn: "Entrées",
      cashOut: "Sorties",
      netCashflow: "Flux net",
      operationalExpenses: "Opérationnelles",
      administrativeExpenses: "Administratives",
      financialExpenses: "Financières",
      addExpense: "Ajouter dépense",
      setBudget: "Définir budget",
      addAccount: "Ajouter compte",
      healthScore: "Score santé",
      excellent: "Excellent",
      good: "Bon",
      warning: "Attention",
      critical: "Critique",
      profitable: "Bénéficiaire",
      loss: "Déficitaire",
      healthy: "Sain",
      okay: "Acceptable",
      thisMonth: "Ce mois",
      thisQuarter: "Ce trimestre",
      thisYear: "Cette année"
    }
  },
  es: {
    common: {
      dashboard: "Tablero",
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Agregar",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      import: "Importar",
      refresh: "Actualizar",
      sync: "Sincronizar",
      actions: "Acciones",
      status: "Estado",
      date: "Fecha",
      amount: "Monto",
      total: "Total",
      paid: "Pagado",
      pending: "Pendiente",
      yes: "Sí",
      no: "No",
      all: "Todos",
      error: "Error",
      success: "Éxito",
      noData: "Sin datos",
      year: "Ejercicio",
      lastUpdate: "ACT",
      cashAlert: "Alerta tesorería",
      margin: "margen",
      forecast: "Proyectada",
      invoicesPending: "facturas impagas",
      currentAssets: "Activo circulante",
      fixedAssets: "Activo fijo",
      currentLiabilities: "Deudas CP",
      longTermLiabilities: "Deudas LP",
      equity: "Patrimonio neto",
      cogs: "Compras y stocks",
      depreciation: "Amortizaciones",
      interestExpense: "Intereses",
      incomeTax: "Impuestos (25%)",
      monthlyEvolution: "Evolución mensual",
      assets: "Activo",
      inventory: "Inventario",
      totalAssets: "TOTAL ACTIVO",
      liabilities: "Pasivo",
      taxLiabilities: "Deudas fiscales",
      totalLiabilities: "Total deudas",
      capital: "Capital",
      reserves: "Reservas",
      currentYearResult: "Resultado ejercicio",
      balanceSheetStructure: "Estructura del balance",
      currentBalance: "Saldo actual",
      monthlyCashflow: "Flujo de caja mensual",
      sixMonthForecast: "Proyección 6 meses",
      byCategory: "Por categoría",
      byFamily: "Por familia",
      transactions: "Transacciones",
      supplier: "Proveedor",
      paymentMethod: "Método pago",
      reference: "Referencia",
      client: "Cliente",
      dueDate: "Vencimiento",
      delay: "Retraso",
      unpaidInvoices: "Facturas impagas",
      agingSchedule: "Calendario de vencimientos",
      customerInvoices: "Facturas cliente",
      budgetVsActual: "Presupuesto vs Real",
      departmentPerformance: "Rendimiento por departamento",
      performanceRadar: "Radar de rendimiento",
      amountExcludingTax: "Monto sin IVA",
      accountName: "Nombre cuenta",
      initialBalance: "Saldo inicial",
      situation: "Situación",
      paymentTerm: "Plazo cliente",
      topClients: "Top 5 clientes",
      topProducts: "Top 5 productos",
      detailedProfitEvolution: "Evolución detallada del resultado",
      expenseDistribution: "Distribución de gastos",
      actual: "Real",
      budget: "Presupuesto",
      performance: "Rendimiento",
      target: "Objetivo",
      category: "Categoría",
      description: "Descripción",
      supplier_label: "Proveedor",
      date_label: "Fecha",
      accountsPayable: "Cuentas por pagar",
      current: "Por vencer",
      debtToEquity: "Endeudamiento",
      debtToEquityDesc: "Deudas / Patrimonio neto",
      currentRatioDesc: "Capacidad de pago de deudas CP",
      quickRatioDesc: "Ratio excluye inventarios",
      netMarginDesc: "Rentabilidad neta %",
      roiDesc: "Retorno inversión",
      roeDesc: "Retorno patrimonio",
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
      check: "Cheque",
      online: "Pago online",
      checking: "Cuenta corriente",
      savings: "Cuenta ahorros",
      netMargin: "Margen neto",
      ebit: "EBIT",
      amountHT: "Monto sin IVA",
      vat: "IVA",
      amountIncVat: "Monto con IVA",
      quarter: "Trimestre",
      currentQuarter: "Trimestre actual",
      cashIn: "Entradas",
      cashOut: "Salidas",
      netCash: "Flujo neto",
      excellent: "Excelente",
      good: "Bueno",
      warning: "Atención",
      critical: "Crítico",
      healthy: "Saneado",
      okay: "Aceptable",
      profitable: "Rentable",
      loss: "Deficitario",
      healthScore: "Puntuación salud",
      roiLong: "Retorno inversión",
      roeLong: "Retorno patrimonio",
      ebitda: "EBITDA",
      ebitLong: "Resultado operativo",
      ebt: "Resultado antes impuestos",
      quickRatio: "Ratio rápido",
      roe: "ROE",
      days: "d",
      monthPlus: "M+",
      quarterShort: "T",
      yearCurrent: "Año actual",
      confirmDelete: "¿Confirmar eliminación?",
      confirmBulkDelete: "¿Confirmar eliminación de {count} elemento(s)?",
      fillAmountAndCategory: "Por favor complete el monto y la categoría",
      fillAmount: "Por favor complete el monto",
      fillAccountName: "Por favor complete el nombre de la cuenta",
      expenseAdded: "Gasto agregado",
      budgetSaved: "Presupuesto guardado",
      accountAdded: "Cuenta bancaria agregada",
      expenseDeleted: "Gasto eliminado",
      expenses: "Gastos",
      other: "Otros",
      overdue: "Vencidas",
      value: "Valor"
    },
    finance: {
      title: "Módulo Finanzas",
      subtitle: "Contabilidad · Tesorería · Análisis · Presupuestos · Fiscalidad",
      revenue: "Ingresos",
      profit: "Beneficio neto",
      cashBalance: "Tesorería",
      ebitda: "EBITDA",
      accountsReceivable: "Cuentas por cobrar",
      accountsPayable: "Cuentas por pagar",
      equity: "Patrimonio neto",
      roi: "ROI global",
      grossMargin: "Margen bruto",
      currentRatio: "Ratio liquidez",
      overdue: "Vencidas",
      dashboard: "Tablero",
      income: "Cuenta de resultados",
      balance: "Balance general",
      cashflow: "Flujo caja",
      expenses: "Gastos",
      invoices: "Facturas",
      budget: "Presupuesto",
      ratios: "Ratios & KPIs",
      cashIn: "Entradas",
      cashOut: "Salidas",
      netCashflow: "Flujo neto",
      operationalExpenses: "Operacionales",
      administrativeExpenses: "Administrativas",
      financialExpenses: "Financieras",
      addExpense: "Agregar gasto",
      setBudget: "Definir presupuesto",
      addAccount: "Agregar cuenta",
      healthScore: "Puntuación salud",
      excellent: "Excelente",
      good: "Bueno",
      warning: "Atención",
      critical: "Crítico",
      profitable: "Rentable",
      loss: "Deficitario",
      healthy: "Saneado",
      okay: "Aceptable",
      thisMonth: "Este mes",
      thisQuarter: "Este trimestre",
      thisYear: "Este año"
    }
  },
  en: {
    common: {
      dashboard: "Dashboard",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      refresh: "Refresh",
      sync: "Sync",
      actions: "Actions",
      status: "Status",
      date: "Date",
      amount: "Amount",
      total: "Total",
      paid: "Paid",
      pending: "Pending",
      yes: "Yes",
      no: "No",
      all: "All",
      error: "Error",
      success: "Success",
      noData: "No data",
      year: "Year",
      lastUpdate: "Updated",
      cashAlert: "Cash alert",
      margin: "margin",
      forecast: "Forecast",
      invoicesPending: "unpaid invoices",
      currentAssets: "Current assets",
      fixedAssets: "Fixed assets",
      currentLiabilities: "Current liabilities",
      longTermLiabilities: "Long-term liabilities",
      equity: "Equity",
      cogs: "Purchases & inventory",
      depreciation: "Depreciation",
      interestExpense: "Interest",
      incomeTax: "Income tax (25%)",
      monthlyEvolution: "Monthly evolution",
      assets: "Assets",
      inventory: "Inventory",
      totalAssets: "TOTAL ASSETS",
      liabilities: "Liabilities",
      taxLiabilities: "Tax liabilities",
      totalLiabilities: "Total liabilities",
      capital: "Capital",
      reserves: "Reserves",
      currentYearResult: "Current year result",
      balanceSheetStructure: "Balance sheet structure",
      currentBalance: "Current balance",
      monthlyCashflow: "Monthly cashflow",
      sixMonthForecast: "6-month forecast",
      byCategory: "By category",
      byFamily: "By family",
      transactions: "Transactions",
      supplier: "Supplier",
      paymentMethod: "Payment method",
      reference: "Reference",
      client: "Client",
      dueDate: "Due date",
      delay: "Delay",
      unpaidInvoices: "Unpaid invoices",
      agingSchedule: "Aging schedule",
      customerInvoices: "Customer invoices",
      budgetVsActual: "Budget vs Actual",
      departmentPerformance: "Department performance",
      performanceRadar: "Performance radar",
      amountExcludingTax: "Amount excluding tax",
      accountName: "Account name",
      initialBalance: "Initial balance",
      situation: "Situation",
      paymentTerm: "Payment term",
      topClients: "Top 5 clients",
      topProducts: "Top 5 products",
      detailedProfitEvolution: "Detailed profit evolution",
      expenseDistribution: "Expense distribution",
      actual: "Actual",
      budget: "Budget",
      performance: "Performance",
      target: "Target",
      category: "Category",
      description: "Description",
      supplier_label: "Supplier",
      date_label: "Date",
      accountsPayable: "Accounts payable",
      current: "Current",
      debtToEquity: "Debt to equity",
      debtToEquityDesc: "Debt / Equity",
      currentRatioDesc: "Ability to pay short-term debt",
      quickRatioDesc: "Ratio excluding inventory",
      netMarginDesc: "Net profitability %",
      roiDesc: "Return on investment",
      roeDesc: "Return on equity",
      cash: "Cash",
      card: "Card",
      transfer: "Transfer",
      check: "Check",
      online: "Online payment",
      checking: "Checking account",
      savings: "Savings account",
      netMargin: "Net margin",
      ebit: "EBIT",
      amountHT: "Amount excl. tax",
      vat: "VAT",
      amountIncVat: "Amount incl. tax",
      quarter: "Quarter",
      currentQuarter: "Current quarter",
      cashIn: "Cash in",
      cashOut: "Cash out",
      netCash: "Net cash",
      excellent: "Excellent",
      good: "Good",
      warning: "Warning",
      critical: "Critical",
      healthy: "Healthy",
      okay: "Acceptable",
      profitable: "Profitable",
      loss: "In deficit",
      healthScore: "Health score",
      roiLong: "Return on investment",
      roeLong: "Return on equity",
      ebitda: "EBITDA",
      ebitLong: "Operating income",
      ebt: "Earnings before tax",
      quickRatio: "Quick ratio",
      roe: "ROE",
      days: "d",
      monthPlus: "M+",
      quarterShort: "Q",
      yearCurrent: "Current year",
      confirmDelete: "Confirm delete?",
      confirmBulkDelete: "Confirm delete {count} item(s)?",
      fillAmountAndCategory: "Please fill in the amount and category",
      fillAmount: "Please fill in the amount",
      fillAccountName: "Please fill in the account name",
      expenseAdded: "Expense added",
      budgetSaved: "Budget saved",
      accountAdded: "Bank account added",
      expenseDeleted: "Expense deleted",
      expenses: "Expenses",
      other: "Other",
      overdue: "Overdue receivables",
      value: "Value"
    },
    finance: {
      title: "Finance Module",
      subtitle: "Accounting · Cashflow · Analysis · Budgets · Taxation",
      revenue: "Revenue",
      profit: "Net profit",
      cashBalance: "Cash balance",
      ebitda: "EBITDA",
      accountsReceivable: "Accounts receivable",
      accountsPayable: "Accounts payable",
      equity: "Equity",
      roi: "Global ROI",
      grossMargin: "Gross margin",
      currentRatio: "Liquidity ratio",
      overdue: "Overdue receivables",
      dashboard: "Dashboard",
      income: "Income statement",
      balance: "Balance sheet",
      cashflow: "Cashflow",
      expenses: "Expenses",
      invoices: "Invoices",
      budget: "Budget",
      ratios: "Ratios & KPIs",
      cashIn: "Cash in",
      cashOut: "Cash out",
      netCashflow: "Net cashflow",
      operationalExpenses: "Operational",
      administrativeExpenses: "Administrative",
      financialExpenses: "Financial",
      addExpense: "Add expense",
      setBudget: "Set budget",
      addAccount: "Add account",
      healthScore: "Health score",
      excellent: "Excellent",
      good: "Good",
      warning: "Warning",
      critical: "Critical",
      profitable: "Profitable",
      loss: "In deficit",
      healthy: "Healthy",
      okay: "Acceptable",
      thisMonth: "This month",
      thisQuarter: "This quarter",
      thisYear: "This year"
    }
  }
};

// ==================== ICONS ====================
const Icon = {
  Revenue: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.4-1.3 2-3 2.5-1.7.5-3 1.1-3 2.5 0 1.4 1.3 2.5 3 2.5s3-1.1 3-2.5"/></svg>),
  TrendUp: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 7l-8.5 8.5-5-5L1 18"/><polyline points="16 7 22 7 22 13"/></svg>),
  TrendDown: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17l-8.5-8.5-5 5L1 6"/><polyline points="16 17 22 17 22 11"/></svg>),
  Wallet: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="16" rx="3"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>),
  BarChart: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="13" width="4" height="9" rx="1"/><rect x="9" y="7" width="4" height="15" rx="1"/><rect x="16" y="2" width="4" height="20" rx="1"/></svg>),
  Scale: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v18M5 21h14"/><path d="M5 7l-3 6h6L5 7z"/><path d="M19 7l-3 6h6l-3-6z"/></svg>),
  Receivable: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>),
  Payable: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="M9 15l3 3 3-3"/></svg>),
  ROI: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>),
  Overdue: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>),
  Target: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
  Bank: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  CheckCircle: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>),
  Inventory: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>),
  Dashboard: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>),
  Income: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>),
  Balance: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M5 21h14"/><path d="M5 7l-3 6h6L5 7z"/><path d="M19 7l-3 6h6l-3-6z"/></svg>),
  Cashflow: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M5 20V10M9 20V6M13 20V12M17 20V3"/></svg>),
  Expense: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V22H4a2 2 0 01-2-2V6a2 2 0 012-2h16v4"/><path d="M20 12a2 2 0 000 4h4v-4z"/><path d="M12 10v4M10 12h4"/></svg>),
  Invoice: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>),
  Budget: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>),
  Ratios: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>),
  Tax: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16M8 8h8M8 16h8"/><circle cx="12" cy="12" r="2"/></svg>),
  Audit: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>),
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Save: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>),
  Refresh: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>),
  Alert: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>),
  Calendar: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
  Clock: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>),
  Close: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>),
  Delete: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>),
  Filter: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>),
  Search: ({ style = undefined as React.CSSProperties | undefined } = {}) => (<svg width="14" height="14" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Menu: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>)
};

const animations = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
`;

const STORAGE_KEYS = {
  EXPENSES: "finance_expenses",
  BUDGETS: "finance_budgets",
  BANK_ACCOUNTS: "finance_bank_accounts",
  CASHFLOW_FORECAST: "finance_cashflow_forecast"
};

const EXPENSE_CATEGORIES = {
  operational: [
    { value: "salaries", labelKey: "salary", icon: "👥", color: "#3b82f6", group: "operational", taxDeductible: true },
    { value: "rent", labelKey: "rent", icon: "🏢", color: "#f59e0b", group: "operational", taxDeductible: true },
    { value: "utilities", labelKey: "utilities", icon: "💡", color: "#10b981", group: "operational", taxDeductible: true },
    { value: "supplies", labelKey: "supplies", icon: "📦", color: "#8b5cf6", group: "operational", taxDeductible: true },
    { value: "marketing", labelKey: "marketing", icon: "📢", color: "#ec4899", group: "operational", taxDeductible: true },
    { value: "transport", labelKey: "transport", icon: "🚚", color: "#06b6d4", group: "operational", taxDeductible: true },
    { value: "maintenance", labelKey: "maintenance", icon: "🔧", color: "#f97316", group: "operational", taxDeductible: true }
  ],
  administrative: [
    { value: "taxes", labelKey: "taxes", icon: "📄", color: "#ef4444", group: "administrative", taxDeductible: true },
    { value: "insurance", labelKey: "insurance", icon: "🛡️", color: "#6366f1", group: "administrative", taxDeductible: true },
    { value: "software", labelKey: "software", icon: "💻", color: "#14b8a6", group: "administrative", taxDeductible: true },
    { value: "training", labelKey: "training", icon: "📚", color: "#a855f7", group: "administrative", taxDeductible: true },
    { value: "legal", labelKey: "legal", icon: "⚖️", color: "#f43f5e", group: "administrative", taxDeductible: true },
    { value: "accounting", labelKey: "accounting", icon: "📊", color: "#0ea5e9", group: "administrative", taxDeductible: true }
  ],
  financial: [
    { value: "interest", labelKey: "interest", icon: "🏦", color: "#eab308", group: "financial", taxDeductible: true },
    { value: "bank_fees", labelKey: "bankFees", icon: "💳", color: "#a855f7", group: "financial", taxDeductible: true }
  ],
  other: [
    { value: "other", labelKey: "other", icon: "📌", color: "#64748b", group: "other", taxDeductible: false }
  ]
};

const bankAccountTypes = [
  { value: "checking", labelKey: "checking", icon: "💰" },
  { value: "savings", labelKey: "savings", icon: "🏦" },
  { value: "cash", labelKey: "cash", icon: "💵" }
];

const paymentMethods = [
  { value: "cash", labelKey: "cash", icon: "💵" },
  { value: "card", labelKey: "card", icon: "💳" },
  { value: "transfer", labelKey: "transfer", icon: "🏦" },
  { value: "check", labelKey: "check", icon: "📝" },
  { value: "online", labelKey: "online", icon: "🌐" }
];

// ─── REUSABLE CARD COMPONENT ──────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accentColor: string;
  index: number;
  theme: any;
  isMobile: boolean;
}

const KpiCard = ({ icon, label, value, detail, accentColor, index, theme, isMobile }: KpiCardProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.surface,
        borderRadius: "18px",
        padding: "20px 16px",
        textAlign: "center",
        border: `1px solid ${hovered ? accentColor + "60" : theme.border}`,
        animation: `fadeInUp 0.45s ease ${0.04 + index * 0.04}s both`,
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? `0 16px 40px ${accentColor}22` : "none",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: "70px", height: "70px", background: `${accentColor}0d`, borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{
        width: "46px", height: "46px", borderRadius: "14px",
        background: `${accentColor}18`, display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 12px", color: accentColor
      }}>
        {icon}
      </div>
      <div style={{ fontSize: isMobile ? "18px" : "22px", color: accentColor, fontWeight: "700", letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, marginTop: "5px" }}>{label}</div>
      <div style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "4px", opacity: 0.65 }}>{detail}</div>
    </div>
  );
};

// ─── STAT BADGE ───────────────────────────────────────────────────────────────
const StatBadge = ({ icon, value, label, theme }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.surfaceHover, padding: "7px 14px", borderRadius: "20px" }}>
    <span style={{ color: theme.textSecondary, display: "flex" }}>{icon}</span>
    <span style={{ fontSize: "12px", color: theme.textSecondary }}>{value}</span>
    <span style={{ fontSize: "11px", color: theme.textSecondary, opacity: 0.6 }}>{label}</span>
  </div>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children, theme, style = {} }: any) => (
  <div style={{
    background: theme.surface, borderRadius: "22px", padding: "22px",
    border: `1px solid ${theme.border}`, ...style
  }}>
    {title && typeof title === 'string' ? (
      <h3 style={{ color: theme.text, marginBottom: "18px", fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>{title}</h3>
    ) : title ? (
      <div style={{ color: theme.text, marginBottom: "18px", fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>{title}</div>
    ) : null}
    {children}
  </div>
);

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, theme, isMobile }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
      <div style={{
        background: theme.surface, padding: isMobile ? "20px" : "28px", borderRadius: isMobile ? "20px" : "28px",
        width: isMobile ? "95%" : "500px", maxHeight: isMobile ? "85vh" : "88vh", overflowY: "auto",
        border: `1px solid ${theme.border}`, boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        animation: "scaleIn 0.2s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ color: theme.text, fontSize: isMobile ? "18px" : "20px", fontWeight: "700", }}>{title}</h2>
          <button onClick={onClose} style={{ background: theme.surfaceHover, border: "none", color: theme.textSecondary, cursor: "pointer", padding: "8px", borderRadius: "10px", display: "flex" }}>
            <Icon.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── FORM INPUT ───────────────────────────────────────────────────────────────
const FormField = ({ as: Tag = "input", theme, style = {}, ...props }: any) => (
  <Tag
    {...props}
    style={{
      width: "100%", padding: "11px 14px", marginBottom: "14px",
      background: theme.surfaceHover, borderRadius: "12px",
      border: `1px solid ${theme.border}`, color: theme.text,
      fontSize: "14px", outline: "none", boxSizing: "border-box",
      ...style
    }}
  />
);

// ─── ACTION BUTTON ─────────────────────────────────────────────────────────────
const ActionButton = ({ icon, label, onClick, color, theme, isMobile }: any) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? color : `${color}18`,
        color: hovered ? "white" : color,
        border: `1px solid ${color}40`,
        padding: isMobile ? "8px 16px" : "10px 20px",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: isMobile ? "12px" : "13px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 20px ${color}40` : "none"
      }}
    >
      {icon}
      {label}
    </button>
  );
};

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
const FilterBar = ({ t, theme, isMobile, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear, years, months, selectedMonth, setSelectedMonth, selectedQuarter, setSelectedQuarter, style }: any) => {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div style={{ marginBottom: "20px", ...style }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: isMobile ? "6px 12px" : "8px 16px", background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "11px" : "13px"
          }}
        >
          <Icon.Filter />
          {t.common.filter}
        </button>
        
        <div style={{ display: "flex", gap: "8px", background: theme.surfaceHover, padding: "4px", borderRadius: "12px" }}>
          {["month", "quarter", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: isMobile ? "4px 10px" : "6px 14px", borderRadius: "8px", border: "none",
                background: selectedPeriod === period ? theme.primary : "transparent",
                color: selectedPeriod === period ? "white" : theme.textSecondary,
                cursor: "pointer", fontSize: isMobile ? "10px" : "12px", fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              {period === "month" ? t.finance.thisMonth : period === "quarter" ? t.finance.thisQuarter : t.finance.thisYear}
            </button>
          ))}
        </div>
        
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(parseInt(e.target.value))}
          style={{ padding: isMobile ? "6px 10px" : "8px 14px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "11px" : "13px" }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      
      {showFilters && (
        <div style={{ marginTop: "12px", padding: isMobile ? "12px" : "16px", background: theme.surfaceHover, borderRadius: "12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {selectedPeriod === "month" && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              style={{ padding: isMobile ? "6px 10px" : "8px 14px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "11px" : "13px" }}
            >
              {months.map((m: string, i: number) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          {selectedPeriod === "quarter" && (
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(parseInt(e.target.value))}
              style={{ padding: isMobile ? "6px 10px" : "8px 14px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "11px" : "13px" }}
            >
              <option value={0}>{t.common.quarterShort}1</option>
              <option value={1}>{t.common.quarterShort}2</option>
              <option value={2}>{t.common.quarterShort}3</option>
              <option value={3}>{t.common.quarterShort}4</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
};

export default function FinancePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const { formatCurrency, getCurrencySymbol } = useAppSettings();

  const t = translations[language as keyof typeof translations]?.finance || translations.fr.finance;
  const tCommon = translations[language as keyof typeof translations]?.common || translations.fr.common;

  // Dimensions responsives
  const contentMarginLeft = isMobile ? "0" : "0px";
  const contentPadding = isMobile ? "12px" : "28px";
  const headerPadding = isMobile ? "16px" : "26px";
  const cardGap = isMobile ? "12px" : "20px";
  const tableMinWidth = isMobile ? "650px" : "100%";
  const chartHeight = isMobile ? "200px" : "250px";
  const chartHeightSmall = isMobile ? "150px" : "180px";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashflowForecast, setCashflowForecast] = useState<any[]>([]);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", date: "", paymentMethod: "transfer", vendor: "", invoiceNumber: "", taxRate: 20 });
  const [budgetForm, setBudgetForm] = useState({ category: "revenue", amount: "", year: new Date().getFullYear(), department: "all" });
  const [bankForm, setBankForm] = useState({ name: "", type: "checking", balance: 0, accountNumber: "", iban: "" });

  const currencySymbol = getCurrencySymbol();
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const [stats, setStats] = useState({
    revenue: 0, costOfGoodsSold: 0, grossProfit: 0, grossMargin: 0,
    operationalExpenses: 0, administrativeExpenses: 0, financialExpenses: 0,
    ebitda: 0, depreciation: 0, ebit: 0, interest: 0, ebt: 0, tax: 0, netProfit: 0, netMargin: 0,
    totalAssets: 0, currentAssets: 0, fixedAssets: 0,
    totalLiabilities: 0, currentLiabilities: 0, longTermLiabilities: 0, equity: 0,
    cashBalance: 0, cashflowIn: 0, cashflowOut: 0, netCashflow: 0,
    forecastCashBalance: 0, cashflowWarning: false,
    accountsReceivable: 0, accountsPayable: 0,
    pendingInvoices: 0, paidInvoices: 0, totalInvoices: 0,
    unpaidAmount: 0, overdueAmount: 0,
    inventoryValue: 0, payrollTotal: 0,
    monthlyTotal: 0, quarterlyTotal: 0, yearlyTotal: 0,
    currentRatio: 0, quickRatio: 0, debtToEquity: 0, roi: 0, roe: 0
  });

  const [trends, setTrends] = useState<any[]>([]);
  const [profitLossData, setProfitLossData] = useState<any[]>([]);
  const [balanceSheetData, setBalanceSheetData] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});
  const [expensesByGroup, setExpensesByGroup] = useState<Record<string, number>>({});
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [cashflowProjection, setCashflowProjection] = useState<any[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<any[]>([]);
  const [agingReport, setAgingReport] = useState<Record<number, number>>({ 0: 0, 30: 0, 60: 0, 90: 0 });
  const [departmentPerformance, setDepartmentPerformance] = useState<any[]>([]);
  const [financialRatios, setFinancialRatios] = useState<any[]>([]);

  const shortMonths = useMemo(() => {
    if (language === "fr") return ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    if (language === "es") return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }, [language]);

  const months = useMemo(() => {
    if (language === "fr") return ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    if (language === "es") return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  }, [language]);

  const getExpenseCategories = useCallback(() => {
    const allCategories: any[] = [];
    Object.values(EXPENSE_CATEGORIES).forEach((group: any) => {
      group.forEach((cat: any) => {
        allCategories.push({
          ...cat,
          label: tCommon[cat.labelKey] || cat.labelKey
        });
      });
    });
    return allCategories;
  }, [tCommon]);

  const getPaymentMethods = useCallback(() => {
    return paymentMethods.map(m => ({
      ...m,
      label: tCommon[m.labelKey] || m.labelKey
    }));
  }, [tCommon]);

  const getBankAccountTypes = useCallback(() => {
    return bankAccountTypes.map(bt => ({
      ...bt,
      label: tCommon[bt.labelKey] || bt.labelKey
    }));
  }, [tCommon]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    loadLocalData();
    fetchAllModuleData();
  }, []);

  useEffect(() => {
    if (!loading) calculateAllFinancialStats();
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter, expenses, budgets, bankAccounts]);

  const loadLocalData = () => {
    try {
      const se = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const sb = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      const sba = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
      const sf = localStorage.getItem(STORAGE_KEYS.CASHFLOW_FORECAST);
      if (se) setExpenses(JSON.parse(se));
      if (sb) setBudgets(JSON.parse(sb));
      if (sba) setBankAccounts(JSON.parse(sba));
      if (sf) setCashflowForecast(JSON.parse(sf));
    } catch (err) { console.error(err); }
  };

  const saveExpenses = (ne: any[]) => { try { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(ne)); setExpenses(ne); } catch { } };
  const saveBudgets = (nb: any[]) => { try { localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(nb)); setBudgets(nb); } catch { } };
  const saveBankAccounts = (na: any[]) => { try { localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(na)); setBankAccounts(na); } catch { } };

  const filterByPeriod = useCallback((data: any[], dateField = "createdAt") => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(item => {
      if (!item[dateField]) return false;
      const date = new Date(item[dateField]);
      if (isNaN(date.getTime())) return false;
      if (selectedPeriod === "month") return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      if (selectedPeriod === "quarter") return Math.floor(date.getMonth() / 3) === selectedQuarter && date.getFullYear() === selectedYear;
      if (selectedPeriod === "year") return date.getFullYear() === selectedYear;
      return true;
    });
  }, [selectedPeriod, selectedMonth, selectedYear, selectedQuarter]);

  const fetchAllModuleData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const fw = async (url: string, def: any[] = []) => {
        try {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return def;
          const data = await res.json();
          return Array.isArray(data) ? data : def;
        } catch { return def; }
      };
      const [sd, pd, id, prd, cd, supp, emp, proj] = await Promise.all([
        fw("http://localhost:3001/sales"),
        fw("http://localhost:3001/purchases"),
        fw("http://localhost:3001/invoices"),
        fw("http://localhost:3001/products"),
        fw("http://localhost:3001/clients"),
        fw("http://localhost:3001/suppliers"),
        fw("http://localhost:3001/employees"),
        fw("http://localhost:3001/projects")
      ]);
      setSales(sd); setPurchases(pd); setInvoices(id); setProducts(prd);
      setClients(cd); setSuppliers(supp); setEmployees(emp); setProjects(proj);
      await calculateAllFinancialStats(sd, pd, id, prd, emp, cd, supp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllModuleData();
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  const calculateAllFinancialStats = async (
    salesData = sales, purchasesData = purchases, invoicesData = invoices,
    productsData = products, employeesData = employees,
    clientsData = clients, suppliersData = suppliers
  ) => {
    const filteredSales = filterByPeriod(salesData, "createdAt");
    const filteredExpenses = filterByPeriod(expenses, "date");
    const filteredPurchases = filterByPeriod(purchasesData, "createdAt");

    const revenue = filteredSales.reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0);
    const costOfGoodsSold = filteredPurchases.reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0);
    const grossProfit = revenue - costOfGoodsSold;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    let operationalExpenses = 0, administrativeExpenses = 0, financialExpenses = 0;
    const expenseCategoriesList = getExpenseCategories();
    filteredExpenses.forEach((e: any) => {
      const cat = expenseCategoriesList.find(c => c.value === e.category);
      const amt = parseFloat(e.amount) || 0;
      if (cat?.group === "operational") operationalExpenses += amt;
      else if (cat?.group === "administrative") administrativeExpenses += amt;
      else if (cat?.group === "financial") financialExpenses += amt;
      else operationalExpenses += amt;
    });

    const totalExpenses = operationalExpenses + administrativeExpenses + financialExpenses;
    const ebitda = grossProfit - operationalExpenses;
    const ebit = ebitda - administrativeExpenses;
    const ebt = ebit - financialExpenses;
    const tax = Math.max(0, ebt * 0.25);
    const netProfit = ebt - tax;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const inventoryValue = productsData.reduce((s: number, p: any) => s + ((parseFloat(p.price) || 0) * (parseInt(p.quantity) || 0)), 0);
    const accountsReceivable = invoicesData.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);
    const accountsPayable = purchasesData.filter((p: any) => p.status !== "paid").reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);
    const cashBalance = bankAccounts.reduce((s: number, a: any) => s + (parseFloat(a.balance) || 0), 0);

    const currentAssets = cashBalance + accountsReceivable + inventoryValue;
    const fixedAssets = currentAssets * 0.3;
    const totalAssets = currentAssets + fixedAssets;
    const currentLiabilities = accountsPayable;
    const longTermLiabilities = currentLiabilities * 0.2;
    const totalLiabilities = currentLiabilities + longTermLiabilities;
    const equity = totalAssets - totalLiabilities;

    const cashflowIn = revenue;
    const cashflowOut = totalExpenses + costOfGoodsSold;
    const netCashflow = cashflowIn - cashflowOut;
    const forecastCashBalance = cashBalance + netCashflow;
    const cashflowWarning = forecastCashBalance < 10000;

    const paidInvoices = invoicesData.filter((i: any) => i.status === "paid").length;
    const pendingInvoices = invoicesData.filter((i: any) => i.status !== "paid").length;
    const overdueAmount = invoicesData.filter((i: any) => i.status !== "paid" && i.dueDate && new Date(i.dueDate) < new Date()).reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);

    const aging: Record<number, number> = { 0: 0, 30: 0, 60: 0, 90: 0 };
    invoicesData.forEach((i: any) => {
      if (i.status !== "paid" && i.dueDate) {
        const days = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
        if (days <= 0) aging[0] += parseFloat(i.amount) || 0;
        else if (days <= 30) aging[30] += parseFloat(i.amount) || 0;
        else if (days <= 60) aging[60] += parseFloat(i.amount) || 0;
        else aging[90] += parseFloat(i.amount) || 0;
      }
    });
    setAgingReport(aging);

    const now = new Date();
    const monthlyTotal = salesData.filter((s: any) => { if (!s.createdAt) return false; const d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0);
    const quarterlyTotal = salesData.filter((s: any) => { if (!s.createdAt) return false; const d = new Date(s.createdAt); return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear(); }).reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0);
    const yearlyTotal = salesData.filter((s: any) => { if (!s.createdAt) return false; return new Date(s.createdAt).getFullYear() === now.getFullYear(); }).reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0);

    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? (currentAssets - inventoryValue) / currentLiabilities : 0;
    const debtToEquity = equity > 0 ? totalLiabilities / equity : 0;
    const roi = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
    const roe = equity > 0 ? (netProfit / equity) * 100 : 0;
    const payrollTotal = employeesData.reduce((s: number, e: any) => s + (parseFloat(e.salary) || 0), 0);

    setStats({
      revenue, costOfGoodsSold, grossProfit, grossMargin,
      operationalExpenses, administrativeExpenses, financialExpenses,
      ebitda, depreciation: totalExpenses * 0.1, ebit, interest: financialExpenses, ebt, tax, netProfit, netMargin,
      totalAssets, currentAssets, fixedAssets,

      totalLiabilities, currentLiabilities, longTermLiabilities, equity,
      cashBalance, cashflowIn, cashflowOut, netCashflow, forecastCashBalance, cashflowWarning,
      accountsReceivable, accountsPayable,
      pendingInvoices, paidInvoices, totalInvoices: invoicesData.length,
      unpaidAmount: accountsReceivable, overdueAmount,
      inventoryValue, payrollTotal,
      monthlyTotal, quarterlyTotal, yearlyTotal,
      currentRatio, quickRatio, debtToEquity, roi, roe
    });

    calculateTrends(salesData, expenses);
    calculateProfitLoss(salesData, expenses, purchasesData);
    calculateBalanceSheet();
    calculateTopPerformers(salesData);
    calculateTopProducts(salesData);
    calculateExpensesAnalysis(expenses);
    calculateCashflowAnalysis(salesData, expenses, purchasesData);
    calculateCashflowProjection(cashBalance, cashflowIn, cashflowOut);
    calculateBudgetVsActual(revenue, totalExpenses, netProfit);
    calculateDepartmentPerformance(projects);
    calculateFinancialRatiosList(currentRatio, quickRatio, netMargin, roi, roe, debtToEquity);
  };

  const calculateTrends = (salesData: any[], expensesData: any[]) => {
    const mr = Array(12).fill(0), me = Array(12).fill(0);
    salesData.forEach((s: any) => { if (s.createdAt) mr[new Date(s.createdAt).getMonth()] += parseFloat(s.total) || 0; });
    expensesData.forEach((e: any) => { if (e.date) me[new Date(e.date).getMonth()] += parseFloat(e.amount) || 0; });
    setTrends(shortMonths.map((m, i) => ({ month: m, revenue: mr[i], expenses: me[i], profit: mr[i] - me[i] })));
  };

  const calculateProfitLoss = (salesData: any[], expensesData: any[], purchasesData: any[]) => {
    const mr = Array(12).fill(0), me = Array(12).fill(0), mc = Array(12).fill(0);
    salesData.forEach((s: any) => { if (s.createdAt) mr[new Date(s.createdAt).getMonth()] += parseFloat(s.total) || 0; });
    expensesData.forEach((e: any) => { if (e.date) me[new Date(e.date).getMonth()] += parseFloat(e.amount) || 0; });
    purchasesData.forEach((p: any) => { if (p.createdAt) mc[new Date(p.createdAt).getMonth()] += parseFloat(p.total) || 0; });
    setProfitLossData(shortMonths.map((m, i) => ({ month: m, revenue: mr[i], cogs: mc[i], grossProfit: mr[i] - mc[i], expenses: me[i], netProfit: mr[i] - mc[i] - me[i] })));
  };

  const calculateBalanceSheet = () => {
    setBalanceSheetData([
      { category: tCommon.currentAssets, amount: stats.currentAssets, color: "#3b82f6" },
      { category: tCommon.fixedAssets, amount: stats.fixedAssets, color: "#8b5cf6" },
      { category: tCommon.currentLiabilities, amount: stats.currentLiabilities, color: "#ef4444" },
      { category: tCommon.longTermLiabilities, amount: stats.longTermLiabilities, color: "#f59e0b" },
      { category: tCommon.equity, amount: stats.equity, color: "#10b981" }
    ]);
  };

  const calculateTopPerformers = (salesData: any[]) => {
    const cs: Record<string, number> = {};
    salesData.forEach((s: any) => { if (s.clientName) cs[s.clientName] = (cs[s.clientName] || 0) + (parseFloat(s.total) || 0); });
    setTopClients(Object.entries(cs).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));
  };

  const calculateTopProducts = (salesData: any[]) => {
    const ps: Record<string, number> = {};
    salesData.forEach((s: any) => { const n = s.productName || s.product; if (n) ps[n] = (ps[n] || 0) + (parseFloat(s.total) || 0); });
    setTopProducts(Object.entries(ps).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));
  };

  const calculateExpensesAnalysis = (expensesData: any[]) => {
    const filtered = filterByPeriod(expensesData, "date");
    const byCategory: Record<string, number> = {};
    const byGroup: Record<string, number> = { operational: 0, administrative: 0, financial: 0, other: 0 };
    const expenseCategoriesList = getExpenseCategories();
    expenseCategoriesList.forEach(c => { byCategory[c.label] = 0; });
    filtered.forEach((e: any) => {
      const cat = expenseCategoriesList.find(c => c.value === e.category);
      const amt = parseFloat(e.amount) || 0;
      if (cat) {
        byCategory[cat.label] = (byCategory[cat.label] || 0) + amt;
        byGroup[cat.group] = (byGroup[cat.group] || 0) + amt;
      } else {
        byCategory[tCommon.other || "Autres"] = (byCategory[tCommon.other || "Autres"] || 0) + amt;
        byGroup.other = (byGroup.other || 0) + amt;
      }
    });
    setExpensesByCategory(byCategory);
    setExpensesByGroup(byGroup);
  };

  const calculateCashflowAnalysis = (sd: any[], ed: any[], pd: any[]) => {
    const ci = Array(12).fill(0), co = Array(12).fill(0);
    sd.forEach((s: any) => { if (s.createdAt) ci[new Date(s.createdAt).getMonth()] += parseFloat(s.total) || 0; });
    ed.forEach((e: any) => { if (e.date) co[new Date(e.date).getMonth()] += parseFloat(e.amount) || 0; });
    pd.forEach((p: any) => { if (p.createdAt) co[new Date(p.createdAt).getMonth()] += parseFloat(p.total) || 0; });
    setCashflowData(shortMonths.map((m, i) => ({ month: m, inflow: ci[i], outflow: co[i], net: ci[i] - co[i] })));
  };

  const calculateCashflowProjection = (cb = 0, cin = 0, cout = 0) => {
    const avg = (cin - cout) / 12;
    const proj: { month: string; balance: number; status: string }[] = [];
    for (let i = 1; i <= 6; i++) {
      const bal = cb + avg * i;
      proj.push({ month: `${tCommon.monthPlus}${i}`, balance: bal, status: bal >= 50000 ? tCommon.excellent : bal >= 10000 ? tCommon.good : bal >= 0 ? tCommon.warning : tCommon.critical });
    }
    setCashflowProjection(proj);
  };

  const calculateBudgetVsActual = (revenue: number, totalExpenses: number, netProfit: number) => {
    const rb = budgets.find(b => b.category === "revenue" && b.year === selectedYear)?.amount || revenue * 1.1;
    const eb = budgets.find(b => b.category === "expenses" && b.year === selectedYear)?.amount || totalExpenses * 0.9;
    const pb = budgets.find(b => b.category === "profit" && b.year === selectedYear)?.amount || netProfit * 1.2;
    setBudgetVsActual([
      { category: t.revenue, budget: rb, actual: revenue, variance: revenue - rb, variancePercent: rb > 0 ? ((revenue - rb) / rb) * 100 : 0 },
      { category: tCommon.expenses, budget: eb, actual: totalExpenses, variance: eb - totalExpenses, variancePercent: eb > 0 ? ((eb - totalExpenses) / eb) * 100 : 0 },
      { category: t.profit, budget: pb, actual: netProfit, variance: netProfit - pb, variancePercent: pb > 0 ? ((netProfit - pb) / pb) * 100 : 0 }
    ]);
  };

  const calculateDepartmentPerformance = (projectsData: any[]) => {
    const dp: Record<string, any> = {};
    projectsData.forEach((p: any) => {
      const dept = p.department || "Général";
      if (!dp[dept]) dp[dept] = { revenue: 0, expenses: 0, profit: 0 };
      dp[dept].revenue += parseFloat(p.budget) || 0;
      dp[dept].expenses += parseFloat(p.cost) || 0;
      dp[dept].profit = dp[dept].revenue - dp[dept].expenses;
    });
    setDepartmentPerformance(Object.entries(dp).map(([name, data]) => ({ name, ...data })));
  };

  const calculateFinancialRatiosList = (cr = 0, qr = 0, nm = 0, r = 0, roeVal = 0, de = 0) => {
    setFinancialRatios([
      { name: t.currentRatio, value: cr, target: 2, status: cr >= 2 ? "good" : cr >= 1 ? "warning" : "critical", description: tCommon.currentRatioDesc },
      { name: tCommon.quickRatio, value: qr, target: 1, status: qr >= 1 ? "good" : qr >= 0.5 ? "warning" : "critical", description: tCommon.quickRatioDesc },
      { name: tCommon.netMargin, value: nm, target: 15, status: nm >= 15 ? "good" : nm >= 8 ? "warning" : "critical", description: tCommon.netMarginDesc },
      { name: tCommon.roiLong, value: r, target: 15, status: r >= 15 ? "good" : r >= 8 ? "warning" : "critical", description: tCommon.roiDesc },
      { name: tCommon.roeLong, value: roeVal, target: 20, status: roeVal >= 20 ? "good" : roeVal >= 10 ? "warning" : "critical", description: tCommon.roeDesc },
      { name: tCommon.debtToEquity, value: de, target: 1, status: de <= 1 ? "good" : de <= 2 ? "warning" : "critical", description: tCommon.debtToEquityDesc }
    ]);
  };

  const addExpense = () => {
    if (!expenseForm.amount || !expenseForm.category) { showMessage(`${tCommon.error}: ${tCommon.fillAmountAndCategory}`, "error"); return; }
    const taxAmt = parseFloat(expenseForm.amount) * (parseFloat(String(expenseForm.taxRate)) / 100);
    const newExpense = {
      id: Date.now(), amount: parseFloat(expenseForm.amount) + taxAmt,
      amountHT: parseFloat(expenseForm.amount), taxAmount: taxAmt,
      taxRate: parseFloat(String(expenseForm.taxRate)), category: expenseForm.category,
      description: expenseForm.description, date: expenseForm.date || new Date().toISOString().split("T")[0],
      paymentMethod: expenseForm.paymentMethod, vendor: expenseForm.vendor,
      invoiceNumber: expenseForm.invoiceNumber, createdAt: new Date().toISOString()
    };
    saveExpenses([newExpense, ...expenses]);
    setExpenseModalOpen(false);
    setExpenseForm({ amount: "", category: "", description: "", date: "", paymentMethod: "transfer", vendor: "", invoiceNumber: "", taxRate: 20 });
    showMessage(`${tCommon.success}: ${tCommon.expenseAdded}`, "success");
  };

  const addBudget = () => {
    if (!budgetForm.amount) { showMessage(`${tCommon.error}: ${tCommon.fillAmount}`, "error"); return; }
    const ei = budgets.findIndex(b => b.category === budgetForm.category && b.year === budgetForm.year && b.department === budgetForm.department);
    let nb;
    if (ei >= 0) { nb = [...budgets]; nb[ei] = { ...nb[ei], amount: parseFloat(budgetForm.amount) }; }
    else { nb = [...budgets, { id: Date.now(), category: budgetForm.category, amount: parseFloat(budgetForm.amount), year: budgetForm.year, department: budgetForm.department, createdAt: new Date().toISOString() }]; }
    saveBudgets(nb);
    setBudgetModalOpen(false);
    setBudgetForm({ category: "revenue", amount: "", year: new Date().getFullYear(), department: "all" });
    showMessage(`${tCommon.success}: ${tCommon.budgetSaved}`, "success");
  };

  const addBankAccount = () => {
    if (!bankForm.name) { showMessage(`${tCommon.error}: ${tCommon.fillAccountName}`, "error"); return; }
    saveBankAccounts([...bankAccounts, { id: Date.now(), ...bankForm, balance: parseFloat(String(bankForm.balance)) || 0, createdAt: new Date().toISOString() }]);
    setBankModalOpen(false);
    setBankForm({ name: "", type: "checking", balance: 0, accountNumber: "", iban: "" });
    showMessage(`${tCommon.success}: ${tCommon.accountAdded}`, "success");
  };

  const deleteExpense = (id: number) => { 
    if (confirm(tCommon.confirmDelete)) {
      saveExpenses(expenses.filter(e => e.id !== id)); 
      showMessage(`${tCommon.success}: ${tCommon.expenseDeleted}`, "success");
    }
  };

  const showMessage = (msg: string, type: string) => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(""), 4000); };

  // Chart config
  const tooltipBase = {
    backgroundColor: theme.surface,
    titleColor: theme.text,
    bodyColor: theme.textSecondary,
    borderColor: theme.border,
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    displayColors: true,
    boxWidth: 10,
    boxHeight: 10,
    boxPadding: 4,
    titleFont: { size: isMobile ? 11 : 13, weight: "bold" as const },
    bodyFont: { size: isMobile ? 10 : 12 },
  };

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" as const },
    plugins: {
      legend: {
        labels: {
          color: theme.textSecondary,
          font: { size: isMobile ? 10 : 12 },
          boxWidth: 10,
          boxHeight: 10,
          padding: isMobile ? 10 : 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
        position: "top" as const,
      },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (ctx: any) => `  ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
      }
    },
    scales: {
      y: {
        ticks: {
          color: theme.textSecondary,
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: 5,
          callback: (v: any) => formatCurrency(v).replace(/\s/g, ""),
        },
        grid: { color: `${theme.border}40`, drawBorder: false },
        border: { display: false },
        beginAtZero: true,
      },
      x: {
        ticks: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 }, maxRotation: 0 },
        grid: { display: false },
        border: { display: false },
      }
    }
  };

  const pieOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeInOutQuart" as const },
    cutout: "62%",
    plugins: {
      legend: {
        labels: {
          color: theme.textSecondary,
          font: { size: isMobile ? 9 : 11 },
          boxWidth: 10,
          boxHeight: 10,
          padding: isMobile ? 8 : 14,
          usePointStyle: true,
          pointStyle: "circle",
        },
        position: "right" as const,
      },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: (ctx: any) => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : "0";
            return `  ${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
          }
        }
      }
    }
  };

  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#ef4444", "#6366f1", "#14b8a6", "#a855f7", "#f43f5e", "#64748b"];

  const revenueExpensesChart = {
    labels: trends.map(t => t.month),
    datasets: [
      {
        label: t.revenue,
        data: trends.map(t => t.revenue),
        backgroundColor: `${theme.accent}22`,
        borderColor: theme.accent,
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: theme.accent,
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 7,
        pointBorderWidth: 2,
        pointBorderColor: theme.surface,
      },
      {
        label: tCommon.expenses,
        data: trends.map(t => t.expenses),
        backgroundColor: "#ef444422",
        borderColor: "#ef4444",
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#ef4444",
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 7,
        pointBorderWidth: 2,
        pointBorderColor: theme.surface,
      }
    ]
  };

  const profitChart = {
    labels: profitLossData.map(p => p.month),
    datasets: [
      {
        label: t.revenue,
        data: profitLossData.map(p => p.revenue),
        backgroundColor: "#3b82f620",
        borderColor: "#3b82f6",
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#3b82f6",
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 7,
        pointBorderWidth: 2,
        pointBorderColor: theme.surface,
      },
      {
        label: t.grossMargin,
        data: profitLossData.map(p => p.grossProfit),
        backgroundColor: "#10b98120",
        borderColor: "#10b981",
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#10b981",
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 7,
        pointBorderWidth: 2,
        pointBorderColor: theme.surface,
      },
      {
        label: t.profit,
        data: profitLossData.map(p => p.netProfit),
        backgroundColor: "#f59e0b20",
        borderColor: "#f59e0b",
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#f59e0b",
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 7,
        pointBorderWidth: 2,
        pointBorderColor: theme.surface,
      }
    ]
  };

  const balanceSheetChart = {
    labels: balanceSheetData.map(b => b.category),
    datasets: [{
      label: tCommon.amount,
      data: balanceSheetData.map(b => b.amount),
      backgroundColor: balanceSheetData.map(b => b.color + "cc"),
      borderColor: balanceSheetData.map(b => b.color),
      borderWidth: 1.5,
      borderRadius: 10,
      borderSkipped: false,
    }]
  };

  const cashflowChart = {
    labels: cashflowData.map(c => c.month),
    datasets: [
      {
        label: tCommon.cashIn,
        data: cashflowData.map(c => c.inflow),
        backgroundColor: "#10b981bb",
        borderColor: "#10b981",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: tCommon.cashOut,
        data: cashflowData.map(c => c.outflow),
        backgroundColor: "#ef4444bb",
        borderColor: "#ef4444",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const cashflowProjChart = {
    labels: cashflowProjection.map(c => c.month),
    datasets: [{
      label: tCommon.forecast,
      data: cashflowProjection.map(c => c.balance),
      borderColor: theme.accent,
      backgroundColor: `${theme.accent}25`,
      fill: true,
      tension: 0.45,
      pointBackgroundColor: cashflowProjection.map(c =>
        c.status === "excellent" ? "#10b981" : c.status === "good" ? "#f59e0b" : "#ef4444"
      ),
      pointRadius: isMobile ? 4 : 6,
      pointHoverRadius: isMobile ? 6 : 9,
      pointBorderWidth: 2,
      pointBorderColor: theme.surface,
      borderWidth: 2.5,
    }]
  };

  const expensesPieData = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      data: Object.values(expensesByCategory),
      backgroundColor: PIE_COLORS,
      borderWidth: 2,
      borderColor: theme.surface,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    }]
  };

  const expensesGroupData = {
    labels: Object.keys(expensesByGroup).map(g => t[g + "Expenses"] || g),
    datasets: [{
      data: Object.values(expensesByGroup),
      backgroundColor: ["#3b82f6", "#f59e0b", "#ec4899", "#64748b"],
      borderWidth: 2,
      borderColor: theme.surface,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    }]
  };

  const budgetChart = {
    labels: budgetVsActual.map(b => b.category),
    datasets: [
      {
        label: tCommon.budget,
        data: budgetVsActual.map(b => b.budget),
        backgroundColor: "#3b82f6bb",
        borderColor: "#3b82f6",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: tCommon.actual,
        data: budgetVsActual.map(b => b.actual),
        backgroundColor: "#10b981bb",
        borderColor: "#10b981",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const agingChart = {
    labels: [`${tCommon.current}`, "1-30 j", "31-60 j", ">60 j"],
    datasets: [{
      data: [agingReport[0], agingReport[30], agingReport[60], agingReport[90]],
      backgroundColor: ["#10b981bb", "#f59e0bbb", "#f97316bb", "#ef4444bb"],
      borderColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
      borderWidth: 1.5,
      borderRadius: 10,
      borderSkipped: false,
    }]
  };

  const departmentChart = {
    labels: departmentPerformance.map(d => d.name),
    datasets: [
      {
        label: t.revenue,
        data: departmentPerformance.map(d => d.revenue),
        backgroundColor: "#3b82f6bb",
        borderColor: "#3b82f6",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: t.profit,
        data: departmentPerformance.map(d => d.profit),
        backgroundColor: "#10b981bb",
        borderColor: "#10b981",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };
  
  const ratiosBarChart = {
    labels: financialRatios.map(r => r.name),
    datasets: [
      {
        label: tCommon.performance,
        data: financialRatios.map(r => r.value),
        backgroundColor: financialRatios.map(r =>
          r.status === "good" ? "#10b981bb" : r.status === "warning" ? "#f59e0bbb" : "#ef4444bb"
        ),
        borderColor: financialRatios.map(r =>
          r.status === "good" ? "#10b981" : r.status === "warning" ? "#f59e0b" : "#ef4444"
        ),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: tCommon.target,
        data: financialRatios.map(r => r.target),
        backgroundColor: "#3b82f650",
        borderColor: "#3b82f6",
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const ratiosBarOptions = {
    ...chartBase,
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...chartBase.plugins,
      legend: {
        ...chartBase.plugins.legend,
        position: "top" as const,
      }
    },
    scales: {
      x: { 
        ticks: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 }, maxTicksLimit: 5 }, 
        grid: { color: `${theme.border}40`, drawBorder: false },
        border: { display: false },
        title: { display: !isMobile, text: `% / ${tCommon.value}`, color: theme.textSecondary, font: { size: 11 } }
      },
      y: { 
        ticks: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 } }, 
        grid: { display: false },
        border: { display: false },
      }
    }
  };

  const kpiCards = [
    { icon: <Icon.Revenue />, label: t.revenue, value: formatCurrency(stats.revenue), accentColor: theme.accent, detail: `${stats.grossMargin.toFixed(1)}% ${t.grossMargin.toLowerCase()}` },
    { icon: <Icon.TrendUp />, label: t.profit, value: formatCurrency(stats.netProfit), accentColor: stats.netProfit >= 0 ? "#10b981" : "#ef4444", detail: `${stats.netMargin.toFixed(1)}% ${tCommon.margin}` },
    { icon: <Icon.Wallet />, label: t.cashBalance, value: formatCurrency(stats.cashBalance), accentColor: stats.cashBalance >= 10000 ? "#06b6d4" : "#ef4444", detail: `${tCommon.forecast}: ${formatCurrency(stats.forecastCashBalance)}` },
    { icon: <Icon.BarChart />, label: t.ebitda, value: formatCurrency(stats.ebitda), accentColor: "#f59e0b", detail: `${stats.revenue > 0 ? ((stats.ebitda / stats.revenue) * 100).toFixed(1) : "0"}% ${tCommon.margin}` },
    { icon: <Icon.Receivable />, label: t.accountsReceivable, value: formatCurrency(stats.accountsReceivable), accentColor: "#f59e0b", detail: `${stats.pendingInvoices} ${tCommon.invoicesPending}` },
    { icon: <Icon.Payable />, label: tCommon.accountsPayable, value: formatCurrency(stats.accountsPayable), accentColor: "#ef4444", detail: tCommon.accountsPayable },
    { icon: <Icon.Scale />, label: t.equity, value: formatCurrency(stats.equity), accentColor: "#8b5cf6", detail: `ROE: ${stats.roe.toFixed(1)}%` },
    { icon: <Icon.ROI />, label: t.roi, value: `${stats.roi.toFixed(1)}%`, accentColor: "#06b6d4", detail: `${t.currentRatio}: ${stats.currentRatio.toFixed(2)}` }
  ];

  const tabsList = [
    { id: "dashboard", label: t.dashboard, icon: <Icon.Dashboard /> },
    { id: "income", label: t.income, icon: <Icon.Income /> },
    { id: "balance", label: t.balance, icon: <Icon.Balance /> },
    { id: "cashflow", label: t.cashflow, icon: <Icon.Cashflow /> },
    { id: "expenses", label: t.expenses, icon: <Icon.Expense /> },
    { id: "invoices", label: t.invoices, icon: <Icon.Invoice /> },
    { id: "budget", label: t.budget, icon: <Icon.Budget /> },
    { id: "ratios", label: t.ratios, icon: <Icon.Ratios /> }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{tCommon.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Contenu principal */}
      <div style={{ 
        marginLeft: contentMarginLeft, 
        flex: 1, 
        padding: isMobile ? "0" : contentPadding,
        paddingBottom: isMobile ? "70px" : "24px",
        width: isMobile ? "100%" : "auto",
        overflowX: "hidden"
      }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* HEADER */}
          <div style={{
            marginBottom: isMobile ? "0" : "28px",
            animation: "fadeInDown 0.5s ease",
            ...(isMobile ? { position: "sticky", top: 0, zIndex: 100 } : {})
          }}>
            <div style={{
              background: theme.surface,
              borderRadius: isMobile ? "0" : "22px",
              padding: headerPadding,
              border: isMobile ? "none" : `1px solid ${theme.border}`,
              borderBottom: isMobile ? `1px solid ${theme.border}` : undefined,
              position: "relative", overflow: "hidden",
              boxShadow: isMobile ? "0 2px 16px rgba(0,0,0,0.10)" : "none"
            }}>
              <div style={{ position: "absolute", top: -60, right: -60, width: "220px", height: "220px", background: `radial-gradient(circle, ${theme.primary}12, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", position: "relative" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                    <div style={{ width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      <Icon.BarChart />
                    </div>
                    <div>
                      <h1 style={{ color: theme.text, fontSize: isMobile ? "20px" : "26px", fontWeight: "700", letterSpacing: "-0.5px" }}>{t.title}</h1>
                      <p style={{ color: theme.textSecondary, marginTop: "3px", fontSize: isMobile ? "10px" : "12px" }}>{t.subtitle}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <StatBadge
                      icon={<Icon.Calendar />}
                      value={selectedPeriod === "month" 
                        ? (isMobile ? shortMonths[selectedMonth] : `${months[selectedMonth]} ${selectedYear}`)
                        : selectedPeriod === "quarter" 
                          ? `${tCommon.quarterShort}${selectedQuarter + 1} ${selectedYear}` 
                          : `${selectedYear}`}
                      label=""
                      theme={theme}
                    />
                    <StatBadge icon={<Icon.Clock />} value={`${tCommon.lastUpdate} ${lastRefresh.toLocaleTimeString()}`} label="" theme={theme} />
                    {stats.cashflowWarning && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.12)", padding: "7px 14px", borderRadius: "20px", animation: "pulse 2s infinite" }}>
                        <Icon.Alert />
                        <span style={{ fontSize: isMobile ? "10px" : "12px", color: "#ef4444", fontWeight: "600" }}>{tCommon.cashAlert}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={refreshData}
                    disabled={refreshing}
                    style={{ padding: isMobile ? "6px 12px" : "9px 16px", background: `${theme.primary}18`, border: `1px solid ${theme.primary}40`, borderRadius: "10px", color: theme.primary, cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "7px", fontSize: isMobile ? "11px" : "13px", fontWeight: "600", opacity: refreshing ? 0.6 : 1, transition: "all 0.2s" }}
                  >
                    <span style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none", display: "inline-flex" }}>
                      <Icon.Refresh />
                    </span>
                    {refreshing ? tCommon.sync + "…" : tCommon.refresh}
                  </button>
                </div>
              </div>

              {/* ACTIONS RAPIDES */}
              <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-start", paddingTop: "16px", borderTop: `1px solid ${theme.border}` }}>
                <ActionButton icon={<Icon.Plus />} label={t.addExpense} onClick={() => setExpenseModalOpen(true)} color={theme.primary} theme={theme} isMobile={isMobile} />
                <ActionButton icon={<Icon.Target />} label={t.setBudget} onClick={() => setBudgetModalOpen(true)} color={theme.accent} theme={theme} isMobile={isMobile} />
                <ActionButton icon={<Icon.Bank />} label={t.addAccount} onClick={() => setBankModalOpen(true)} color="#8b5cf6" theme={theme} isMobile={isMobile} />
              </div>

              {/* FILTERS */}
              <FilterBar 
                style={{ marginTop: "20px", paddingBottom: "0" }}
                t={{ common: tCommon, finance: t }}
                theme={theme}
                isMobile={isMobile}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                years={years}
                months={months}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedQuarter={selectedQuarter}
                setSelectedQuarter={setSelectedQuarter}
              />
             
              {/* Search bar */}
              <div style={{ marginTop: "16px", position: "relative" }}>
                <Icon.Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder={`${tCommon.search}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: isMobile ? "8px 10px 8px 32px" : "10px 12px 10px 36px",
                    background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                    borderRadius: "12px", color: theme.text, fontSize: isMobile ? "12px" : "13px",
                    outline: "none", transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>

              {/* Health bar */}
              <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {[
                  { label: tCommon.situation, value: stats.netProfit >= 0 ? `${tCommon.profitable} ✓` : `${tCommon.loss} ✗`, color: stats.netProfit >= 0 ? "#10b981" : "#ef4444" },
                  { label: `${tCommon.forecast} ${tCommon.monthPlus}3`, value: formatCurrency(cashflowProjection[2]?.balance || 0), color: (cashflowProjection[2]?.balance || 0) >= 10000 ? "#10b981" : "#ef4444" },
                  { label: tCommon.paymentTerm, value: `45 ${tCommon.days}`, color: "#f59e0b" },
                  { label: tCommon.healthScore, value: `${Math.min(100, Math.round(stats.currentRatio * 30 + Math.max(0, stats.netMargin) * 2))}/100`, color: theme.accent }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", marginBottom: "2px" }}>{item.label}</div>
                    <div style={{ color: item.color, fontWeight: "700", fontSize: isMobile ? "12px" : "14px" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT (mobile padding wrapper) */}
          <div style={{ padding: isMobile ? "16px 12px" : "0", marginTop: isMobile ? "0" : "0" }}>

          {/* MESSAGE */}
          {message && (
            <div style={{ background: messageType === "success" ? "#10b98115" : "#ef444415", border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, color: messageType === "success" ? "#10b981" : "#ef4444", padding: isMobile ? "10px" : "13px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: isMobile ? "12px" : "14px", fontWeight: "500", animation: "slideIn 0.3s ease" }}>
              {messageType === "success" ? <Icon.CheckCircle /> : <Icon.Alert />}
              {message}
            </div>
          )}

          {/* KPI GRID */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "150px" : "190px"}, 1fr))`, gap: cardGap, marginBottom: "28px" }}>
            {kpiCards.map((card, idx) => (
              <KpiCard key={idx} {...card} index={idx} theme={theme} isMobile={isMobile} />
            ))}
          </div>

          {/* TABS */}
          <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: `2px solid ${theme.border}`, overflowX: "auto", paddingBottom: "0", WebkitOverflowScrolling: "touch" }}>
            {tabsList.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? "8px 12px" : "11px 20px", background: "transparent", border: "none",
                  borderBottom: activeTab === tab.id ? `2px solid ${theme.primary}` : "2px solid transparent",
                  marginBottom: "-2px",
                  color: activeTab === tab.id ? theme.primary : theme.textSecondary,
                  cursor: "pointer", transition: "all 0.2s", fontWeight: activeTab === tab.id ? "600" : "500",
                  fontSize: isMobile ? "10px" : "13px", display: "flex", alignItems: "center", gap: "5px",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* TABLEAU DE BORD */}
          {activeTab === "dashboard" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <SectionCard title={<><Icon.TrendUp /> {t.revenue} & {tCommon.expenses}</>} theme={theme}>
                  <div style={{ height: chartHeight, position: "relative" }}>
                    <Line data={revenueExpensesChart} options={chartBase} />
                  </div>
                </SectionCard>
                <SectionCard title={<><Icon.BarChart /> {tCommon.expenseDistribution}</>} theme={theme}>
                  {Object.values(expensesByCategory).some(v => v > 0)
                    ? <div style={{ height: chartHeight, position: "relative" }}>
                        <Doughnut data={expensesPieData} options={pieOpts} />
                      </div>
                    : <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                  }
                </SectionCard>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                  { icon: <Icon.BarChart />, label: t.grossMargin, value: `${stats.grossMargin.toFixed(1)}%`, color: "#3b82f6" },
                  { icon: <Icon.Scale />, label: t.currentRatio, value: stats.currentRatio.toFixed(2), color: "#8b5cf6" },
                  { icon: <Icon.Overdue />, label: t.overdue, value: formatCurrency(stats.overdueAmount), color: "#f59e0b" },
                  { icon: <Icon.ROI />, label: t.roi, value: `${stats.roi.toFixed(1)}%`, color: "#06b6d4" }
                ].map((item, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "18px", padding: "16px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                    <div style={{ width: isMobile ? "32px" : "38px", height: isMobile ? "32px" : "38px", borderRadius: "12px", background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: item.color }}>{item.icon}</div>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "700", color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: isMobile ? "9px" : "11px", color: theme.textSecondary, marginTop: "4px" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <SectionCard title={<><Icon.Revenue /> {tCommon.topClients}</>} theme={theme}>
                  {topClients.length === 0
                    ? <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                    : topClients.map((c, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.surfaceHover}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: `${theme.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: theme.primary }}>{i + 1}</div>
                          <span style={{ fontSize: isMobile ? "11px" : "13px", color: theme.text, wordBreak: "break-word" }}>{c.name}</span>
                        </div>
                        <span style={{ color: theme.accent, fontWeight: "700", fontSize: isMobile ? "11px" : "13px" }}>{formatCurrency(c.amount)}</span>
                      </div>
                    ))
                  }
                </SectionCard>
                <SectionCard title={<><Icon.Inventory /> {tCommon.topProducts}</>} theme={theme}>
                  {topProducts.length === 0
                    ? <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                    : topProducts.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.surfaceHover}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: `${theme.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: theme.accent }}>{i + 1}</div>
                          <span style={{ fontSize: isMobile ? "11px" : "13px", color: theme.text, wordBreak: "break-word" }}>{p.name}</span>
                        </div>
                        <span style={{ color: theme.accent, fontWeight: "700", fontSize: isMobile ? "11px" : "13px" }}>{formatCurrency(p.amount)}</span>
                      </div>
                    ))
                  }
                </SectionCard>
              </div>

              <SectionCard title={<><Icon.TrendUp /> {tCommon.detailedProfitEvolution}</>} theme={theme}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Line data={profitChart} options={chartBase} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* COMPTE DE RÉSULTAT */}
          {activeTab === "income" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <SectionCard theme={theme} style={{ marginBottom: "20px" }}>
                <h3 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "15px" : "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon.Income /> {t.income}
                </h3>
                {[
                  { label: t.revenue, value: formatCurrency(stats.revenue), bold: true, color: theme.accent },
                  { label: `└ ${tCommon.cogs}`, value: `− ${formatCurrency(stats.costOfGoodsSold)}`, indent: true, muted: true },
                  { label: `└ ${t.grossMargin}`, value: `${formatCurrency(stats.grossProfit)} (${stats.grossMargin.toFixed(1)}%)`, indent: true, color: "#10b981" },
                  { label: t.operationalExpenses, value: `− ${formatCurrency(stats.operationalExpenses)}`, muted: true },
                  { label: t.administrativeExpenses, value: `− ${formatCurrency(stats.administrativeExpenses)}`, muted: true },
                  { label: t.financialExpenses, value: `− ${formatCurrency(stats.financialExpenses)}`, muted: true },
                  { label: tCommon.ebitda, value: formatCurrency(stats.ebitda), bold: true, color: "#f59e0b" },
                  { label: `└ ${tCommon.depreciation}`, value: `− ${formatCurrency(stats.depreciation)}`, indent: true, muted: true },
                  { label: tCommon.ebitLong, value: formatCurrency(stats.ebit), bold: true, color: stats.ebit >= 0 ? "#10b981" : "#ef4444" },
                  { label: `└ ${tCommon.interestExpense}`, value: `− ${formatCurrency(stats.interest)}`, indent: true, muted: true },
                  { label: tCommon.ebt, value: formatCurrency(stats.ebt), bold: true, color: stats.ebt >= 0 ? "#10b981" : "#ef4444" },
                  { label: `└ ${tCommon.incomeTax}`, value: `− ${formatCurrency(stats.tax)}`, indent: true, muted: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", paddingLeft: row.indent ? "16px" : "0", borderBottom: `1px solid ${theme.surfaceHover}` }}>
                    <span style={{ fontSize: isMobile ? "11px" : "14px", color: row.muted ? theme.textSecondary : theme.text, fontWeight: row.bold ? "600" : "400" }}>{row.label}</span>
                    <span style={{ fontSize: isMobile ? "11px" : "14px", fontWeight: row.bold ? "700" : "400", color: row.color || (row.muted ? theme.textSecondary : theme.text) }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", marginTop: "12px", background: stats.netProfit >= 0 ? "#10b98112" : "#ef444412", borderRadius: "14px", border: `1px solid ${stats.netProfit >= 0 ? "#10b981" : "#ef4444"}30` }}>
                  <span style={{ fontWeight: "700", fontSize: isMobile ? "14px" : "16px", color: theme.text }}>{t.profit.toUpperCase()}</span>
                  <span style={{ fontWeight: "800", fontSize: isMobile ? "16px" : "20px", color: stats.netProfit >= 0 ? "#10b981" : "#ef4444" }}>
                    {formatCurrency(stats.netProfit)} <span style={{ fontSize: isMobile ? "10px" : "14px" }}>({stats.netMargin.toFixed(1)}%)</span>
                  </span>
                </div>
              </SectionCard>
              <SectionCard title={<><Icon.TrendUp /> {tCommon.monthlyEvolution}</>} theme={theme}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Line data={profitChart} options={chartBase} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* BILAN COMPTABLE */}
          {activeTab === "balance" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <SectionCard theme={theme}>
                  <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon.TrendUp /> {tCommon.assets}
                  </h3>
                  {[
                    { label: t.cashBalance, value: formatCurrency(stats.cashBalance), indent: true },
                    { label: t.accountsReceivable, value: formatCurrency(stats.accountsReceivable), indent: true },
                    { label: tCommon.inventory, value: formatCurrency(stats.inventoryValue), indent: true },
                    { label: tCommon.currentAssets, value: formatCurrency(stats.currentAssets), bold: true, color: "#3b82f6" },
                    { label: tCommon.fixedAssets, value: formatCurrency(stats.fixedAssets), bold: true },
                    { label: tCommon.totalAssets, value: formatCurrency(stats.totalAssets), bold: true, color: theme.accent, big: true },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", paddingLeft: r.indent ? "12px" : "0", borderBottom: `1px solid ${theme.surfaceHover}` }}>
                      <span style={{ fontSize: r.big ? (isMobile ? "13px" : "15px") : (isMobile ? "11px" : "13px"), color: r.bold ? theme.text : theme.textSecondary, fontWeight: r.bold ? "600" : "400" }}>{r.label}</span>
                      <span style={{ fontSize: r.big ? (isMobile ? "13px" : "15px") : (isMobile ? "11px" : "13px"), fontWeight: r.bold ? "700" : "400", color: r.color || (r.bold ? theme.text : theme.textSecondary) }}>{r.value}</span>
                    </div>
                  ))}
                </SectionCard>
                <SectionCard theme={theme}>
                  <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon.Scale /> {tCommon.liabilities}
                  </h3>
                  {[
                    { label: tCommon.accountsPayable, value: formatCurrency(stats.accountsPayable), indent: true },
                    { label: tCommon.taxLiabilities, value: formatCurrency(Math.max(0, stats.currentLiabilities - stats.accountsPayable)), indent: true },
                    { label: tCommon.totalLiabilities, value: formatCurrency(stats.totalLiabilities), bold: true, color: "#ef4444" },
                    { label: tCommon.capital, value: formatCurrency(stats.equity * 0.6), indent: true },
                    { label: tCommon.reserves, value: formatCurrency(stats.equity * 0.3), indent: true },
                    { label: tCommon.currentYearResult, value: formatCurrency(stats.netProfit), indent: true },
                    { label: t.equity, value: formatCurrency(stats.equity), bold: true, color: "#10b981" },
                    { label: tCommon.totalAssets, value: formatCurrency(stats.totalAssets), bold: true, color: theme.accent, big: true },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", paddingLeft: r.indent ? "12px" : "0", borderBottom: `1px solid ${theme.surfaceHover}` }}>
                      <span style={{ fontSize: r.big ? (isMobile ? "13px" : "15px") : (isMobile ? "11px" : "13px"), color: r.bold ? theme.text : theme.textSecondary, fontWeight: r.bold ? "600" : "400" }}>{r.label}</span>
                      <span style={{ fontSize: r.big ? (isMobile ? "13px" : "15px") : (isMobile ? "11px" : "13px"), fontWeight: r.bold ? "700" : "400", color: r.color || (r.bold ? theme.text : theme.textSecondary) }}>{r.value}</span>
                    </div>
                  ))}
                </SectionCard>
              </div>
              <SectionCard title={<><Icon.BarChart /> {tCommon.balanceSheetStructure}</>} theme={theme}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Bar data={balanceSheetChart} options={chartBase} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* TRÉSORERIE */}
          {activeTab === "cashflow" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
                {[
                  { icon: <Icon.Bank />, label: tCommon.currentBalance, value: formatCurrency(stats.cashBalance), color: stats.cashBalance >= 0 ? theme.accent : "#ef4444" },
                  { icon: <Icon.Cashflow />, label: t.netCashflow, value: formatCurrency(stats.netCashflow), color: stats.netCashflow >= 0 ? "#10b981" : "#ef4444" },
                  { icon: <Icon.TrendUp />, label: `${tCommon.forecast} ${tCommon.monthPlus}3`, value: formatCurrency(cashflowProjection[2]?.balance || 0), color: (cashflowProjection[2]?.balance || 0) >= 0 ? "#10b981" : "#ef4444" }
                ].map((c, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "20px", padding: isMobile ? "16px" : "26px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                    <div style={{ width: isMobile ? "36px" : "46px", height: isMobile ? "36px" : "46px", borderRadius: "14px", background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: c.color }}>{c.icon}</div>
                    <div style={{ fontSize: isMobile ? "20px" : "28px", color: c.color, fontWeight: "800", letterSpacing: "-1px" }}>{c.value}</div>
                    <div style={{ fontSize: isMobile ? "11px" : "13px", color: theme.textSecondary, marginTop: "4px" }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <SectionCard title={<><Icon.Cashflow /> {tCommon.monthlyCashflow}</>} theme={theme} style={{ marginBottom: "20px" }}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Bar data={cashflowChart} options={chartBase} />
                </div>
              </SectionCard>
              <SectionCard title={<><Icon.TrendUp /> {tCommon.sixMonthForecast}</>} theme={theme}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Line data={cashflowProjChart} options={chartBase} />
                </div>
                <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 6}, 1fr)`, gap: "8px" }}>
                  {cashflowProjection.map((p, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "8px", background: theme.surfaceHover, borderRadius: "10px" }}>
                      <div style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: "700", color: theme.text }}>{p.month}</div>
                      <div style={{ fontSize: isMobile ? "10px" : "13px", color: p.status === "excellent" ? "#10b981" : p.status === "good" ? "#f59e0b" : "#ef4444", fontWeight: "700", marginTop: "2px" }}>{formatCurrency(p.balance)}</div>
                      <div style={{ fontSize: isMobile ? "8px" : "9px", color: theme.textSecondary, marginTop: "2px" }}>{p.status === "excellent" ? `🟢 ${tCommon.healthy}` : p.status === "good" ? `🟡 ${tCommon.okay}` : `🔴 ${tCommon.critical}`}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ANALYSE DÉPENSES */}
          {activeTab === "expenses" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                  { icon: <Icon.Expense />, label: t.operationalExpenses, value: formatCurrency(stats.operationalExpenses), color: "#3b82f6" },
                  { icon: <Icon.Invoice />, label: t.administrativeExpenses, value: formatCurrency(stats.administrativeExpenses), color: "#8b5cf6" },
                  { icon: <Icon.Bank />, label: t.financialExpenses, value: formatCurrency(stats.financialExpenses), color: "#ef4444" }
                ].map((c, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "18px", padding: "16px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                    <div style={{ width: isMobile ? "32px" : "40px", height: isMobile ? "32px" : "40px", borderRadius: "12px", background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: c.color }}>{c.icon}</div>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "700", color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginTop: "4px" }}>{c.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <SectionCard title={<><Icon.BarChart /> {tCommon.byCategory}</>} theme={theme}>
                  <div style={{ height: chartHeightSmall, position: "relative" }}>
                    <Doughnut data={expensesPieData} options={pieOpts} />
                  </div>
                </SectionCard>
                <SectionCard title={<><Icon.BarChart /> {tCommon.byFamily}</>} theme={theme}>
                  <div style={{ height: chartHeightSmall, position: "relative" }}>
                    <Doughnut data={expensesGroupData} options={pieOpts} />
                  </div>
                </SectionCard>
              </div>

              <SectionCard title={<><Icon.Invoice /> {tCommon.transactions}</>} theme={theme} style={{ overflowX: "auto" }}>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: tableMinWidth }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                        {[tCommon.date_label, tCommon.category, tCommon.amountHT, tCommon.vat, tCommon.amountIncVat, tCommon.supplier_label, tCommon.paymentMethod, ""].map((h, i) => (
                          <th key={i} style={{ padding: "8px 10px", textAlign: i >= 2 && i <= 4 ? "right" : "left", fontSize: isMobile ? "10px" : "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                        ))}
                       </tr>
                    </thead>
                    <tbody>
                      {expenses.filter(e => {
                        if (!e.date) return false;
                        const d = new Date(e.date);
                        if (selectedPeriod === "month") return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                        if (selectedPeriod === "quarter") return Math.floor(d.getMonth() / 3) === selectedQuarter && d.getFullYear() === selectedYear;
                        if (selectedPeriod === "year") return d.getFullYear() === selectedYear;
                        return true;
                      }).filter(e => {
                        if (!searchTerm) return true;
                        const cat = getExpenseCategories().find(c => c.value === e.category);
                        return (e.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (e.vendor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (cat?.label || "").toLowerCase().includes(searchTerm.toLowerCase());
                      }).slice(0, 50).map((exp, i) => {
                        const cat = getExpenseCategories().find(c => c.value === exp.category);
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${theme.surfaceHover}` }} onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>
                              {new Date(exp.date).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ background: `${cat?.color || "#64748b"}18`, color: cat?.color || "#64748b", padding: "2px 6px", borderRadius: "16px", fontSize: isMobile ? "9px" : "11px", fontWeight: "600" }}>
                                {cat?.icon} {cat?.label || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontSize: isMobile ? "10px" : "13px" }}>
                              {formatCurrency(exp.amountHT || exp.amount / 1.2)}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontSize: isMobile ? "10px" : "13px", color: theme.textSecondary }}>
                              {formatCurrency(exp.taxAmount || exp.amount * 0.2)}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontSize: isMobile ? "10px" : "13px", color: "#ef4444", fontWeight: "700" }}>
                              {formatCurrency(exp.amount)}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "11px" : "13px" }}>
                              {exp.vendor || "—"}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>
                              {getPaymentMethods().find(p => p.value === exp.paymentMethod)?.icon}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <button onClick={() => deleteExpense(exp.id)} style={{ background: "#ef444418", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px 6px", borderRadius: "6px", display: "flex", transition: "background 0.15s" }}>
                                <Icon.Delete />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {expenses.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                )}
              </SectionCard>
            </div>
          )}

          {/* GESTION CLIENTS */}
          {activeTab === "invoices" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                  { icon: <Icon.Receivable />, label: t.accountsReceivable, value: formatCurrency(stats.accountsReceivable), color: theme.accent },
                  { icon: <Icon.Invoice />, label: tCommon.unpaidInvoices, value: String(stats.pendingInvoices), color: "#f59e0b" },
                  { icon: <Icon.Overdue />, label: t.overdue, value: formatCurrency(stats.overdueAmount), color: "#ef4444" }
                ].map((c, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "18px", padding: "16px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                    <div style={{ width: isMobile ? "32px" : "42px", height: isMobile ? "32px" : "42px", borderRadius: "13px", background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: c.color }}>{c.icon}</div>
                    <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "700", color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginTop: "4px" }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <SectionCard title={<><Icon.BarChart /> {tCommon.agingSchedule}</>} theme={theme} style={{ marginBottom: "20px" }}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Bar data={agingChart} options={{ ...chartBase, plugins: { ...chartBase.plugins, legend: { display: false } } }} />
                </div>
              </SectionCard>

              <SectionCard title={<><Icon.Invoice /> {tCommon.customerInvoices}</>} theme={theme} style={{ overflowX: "auto" }}>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                        {[tCommon.reference, tCommon.client, tCommon.amount, tCommon.status, tCommon.dueDate, tCommon.delay].map((h, i) => (
                          <th key={i} style={{ padding: "8px 10px", textAlign: i === 2 ? "right" : "left", fontSize: isMobile ? "10px" : "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                        ))}
                       </tr>
                    </thead>
                    <tbody>
                      {invoices.filter(inv => {
                        if (!searchTerm) return true;
                        return (inv.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (inv.clientName || "").toLowerCase().includes(searchTerm.toLowerCase());
                      }).slice(0, 50).map((inv, i) => {
                        const isOverdue = inv.status !== "paid" && inv.dueDate && new Date(inv.dueDate) < new Date();
                        const daysOverdue = inv.dueDate ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0;
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${theme.surfaceHover}` }}>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "11px" : "13px", color: theme.textSecondary }}>{inv.reference || "—"}</td>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "11px" : "13px" }}>{inv.clientName || "—"}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontSize: isMobile ? "11px" : "13px", fontWeight: "700", color: theme.accent }}>{formatCurrency(inv.amount)}</td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ background: inv.status === "paid" ? "#10b98120" : isOverdue ? "#ef444420" : "#f59e0b20", color: inv.status === "paid" ? "#10b981" : isOverdue ? "#ef4444" : "#f59e0b", padding: "2px 6px", borderRadius: "16px", fontSize: isMobile ? "9px" : "11px", fontWeight: "600" }}>
                                {inv.status === "paid" ? tCommon.paid : isOverdue ? tCommon.overdue : tCommon.pending}
                              </span>
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US") : "—"}</td>
                            <td style={{ padding: "8px 10px", fontSize: isMobile ? "10px" : "12px", color: isOverdue ? "#ef4444" : theme.textSecondary, fontWeight: isOverdue ? "600" : "400" }}>{isOverdue ? `${daysOverdue}${tCommon.days}` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {invoices.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                )}
              </SectionCard>
            </div>
          )}

          {/* BUDGET & PRÉVISIONS */}
          {activeTab === "budget" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {budgetVsActual.map((item, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "18px", padding: "16px", border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginBottom: "4px" }}>{item.category} {selectedYear}</div>
                    <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "700", color: theme.text }}>{formatCurrency(item.budget)}</div>
                    <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginTop: "4px" }}>{tCommon.actual}: {formatCurrency(item.actual)}</div>
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: item.variance >= 0 ? "#10b981" : "#ef4444" }}>
                        {item.variance >= 0 ? <Icon.TrendUp /> : <Icon.TrendDown />}
                      </span>
                      <span style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: "700", color: item.variance >= 0 ? "#10b981" : "#ef4444" }}>{item.variancePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <SectionCard title={<><Icon.Target /> {tCommon.budgetVsActual}</>} theme={theme} style={{ marginBottom: "20px" }}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Bar data={budgetChart} options={chartBase} />
                </div>
              </SectionCard>
              <SectionCard title={<><Icon.BarChart /> {tCommon.departmentPerformance}</>} theme={theme}>
                {departmentPerformance.length > 0
                  ? <div style={{ height: chartHeightSmall, position: "relative" }}>
                      <Bar data={departmentChart} options={chartBase} />
                    </div>
                  : <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>{tCommon.noData}</div>
                }
              </SectionCard>
            </div>
          )}

          {/* RATIOS & KPIs */}
          {activeTab === "ratios" && (
            <div style={{ animation: "fadeInUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "130px" : "180px"}, 1fr))`, gap: "14px", marginBottom: "20px" }}>
                {financialRatios.map((r, i) => (
                  <div key={i} style={{ background: theme.surface, borderRadius: "18px", padding: "16px", textAlign: "center", border: `1px solid ${r.status === "good" ? "#10b98130" : r.status === "warning" ? "#f59e0b30" : "#ef444430"}` }}>
                    <div style={{ fontSize: isMobile ? "18px" : "22px", marginBottom: "4px" }}>{r.status === "good" ? "🟢" : r.status === "warning" ? "🟡" : "🔴"}</div>
                    <div style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: "800", color: r.status === "good" ? "#10b981" : r.status === "warning" ? "#f59e0b" : "#ef4444", letterSpacing: "-1px" }}>{r.value.toFixed(1)}</div>
                    <div style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: "600", color: theme.text, marginTop: "4px" }}>{r.name}</div>
                    <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary, marginTop: "2px" }}>{tCommon.target}: {r.target}{r.name.includes(t.currentRatio) ? "" : "%"}</div>
                    <div style={{ fontSize: isMobile ? "7px" : "9px", color: theme.textSecondary, marginTop: "4px", opacity: 0.7, wordBreak: "break-word" }}>{r.description}</div>
                  </div>
                ))}
              </div>
              <SectionCard title={<><Icon.Ratios /> {tCommon.performanceRadar}</>} theme={theme}>
                <div style={{ height: chartHeightSmall, position: "relative" }}>
                  <Bar data={ratiosBarChart} options={ratiosBarOptions} />
                </div>
              </SectionCard>
            </div>
          )}

          </div>{/* end mobile padding wrapper */}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={t.addExpense} theme={theme} isMobile={isMobile}>
        <FormField as="select" theme={theme} value={expenseForm.category} onChange={(e: any) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
          <option value="">— {tCommon.category} —</option>
          {getExpenseCategories().map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </FormField>
        <FormField type="number" placeholder={`${tCommon.amountExcludingTax} (${currencySymbol})`} theme={theme} value={expenseForm.amount} onChange={(e: any) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
        <FormField as="select" theme={theme} value={expenseForm.taxRate} onChange={(e: any) => setExpenseForm({ ...expenseForm, taxRate: e.target.value })}>
          <option value="0">{tCommon.vat} 0%</option>
          <option value="5.5">{tCommon.vat} 5.5%</option>
          <option value="10">{tCommon.vat} 10%</option>
          <option value="20">{tCommon.vat} 20%</option>
        </FormField>
        <FormField type="text" placeholder={tCommon.description} theme={theme} value={expenseForm.description} onChange={(e: any) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
        <FormField type="text" placeholder={tCommon.supplier_label} theme={theme} value={expenseForm.vendor} onChange={(e: any) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
        <FormField type="date" theme={theme} value={expenseForm.date} onChange={(e: any) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
        <FormField as="select" theme={theme} value={expenseForm.paymentMethod} onChange={(e: any) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })} style={{ marginBottom: "22px" }}>
          {getPaymentMethods().map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
        </FormField>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={addExpense} style={{ flex: 1, padding: "12px", background: theme.primary, color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon.Save /> {tCommon.save}
          </button>
          <button onClick={() => setExpenseModalOpen(false)} style={{ flex: 1, padding: "12px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer", fontWeight: "500", fontSize: isMobile ? "13px" : "14px" }}>
            {tCommon.cancel}
          </button>
        </div>
      </Modal>

      <Modal open={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title={t.setBudget} theme={theme} isMobile={isMobile}>
        <FormField as="select" theme={theme} value={budgetForm.category} onChange={(e: any) => setBudgetForm({ ...budgetForm, category: e.target.value })}>
          <option value="revenue">💰 {t.revenue}</option>
          <option value="expenses">📉 {tCommon.expenses}</option>
          <option value="profit">📈 {t.profit}</option>
        </FormField>
        <FormField type="number" placeholder={`${tCommon.amount} (${currencySymbol})`} theme={theme} value={budgetForm.amount} onChange={(e: any) => setBudgetForm({ ...budgetForm, amount: e.target.value })} />
        <FormField as="select" theme={theme} value={budgetForm.year} onChange={(e: any) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })} style={{ marginBottom: "22px" }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </FormField>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={addBudget} style={{ flex: 1, padding: "12px", background: theme.primary, color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon.Save /> {tCommon.save}
          </button>
          <button onClick={() => setBudgetModalOpen(false)} style={{ flex: 1, padding: "12px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer", fontWeight: "500", fontSize: isMobile ? "13px" : "14px" }}>
            {tCommon.cancel}
          </button>
        </div>
      </Modal>

      <Modal open={bankModalOpen} onClose={() => setBankModalOpen(false)} title={t.addAccount} theme={theme} isMobile={isMobile}>
        <FormField type="text" placeholder={tCommon.accountName} theme={theme} value={bankForm.name} onChange={(e: any) => setBankForm({ ...bankForm, name: e.target.value })} />
        <FormField as="select" theme={theme} value={bankForm.type} onChange={(e: any) => setBankForm({ ...bankForm, type: e.target.value })}>
          {getBankAccountTypes().map(bt => <option key={bt.value} value={bt.value}>{bt.icon} {bt.label}</option>)}
        </FormField>
        <FormField type="number" placeholder={`${tCommon.initialBalance} (${currencySymbol})`} theme={theme} value={bankForm.balance} onChange={(e: any) => setBankForm({ ...bankForm, balance: e.target.value })} style={{ marginBottom: "22px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={addBankAccount} style={{ flex: 1, padding: "12px", background: theme.primary, color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon.Save /> {tCommon.add}
          </button>
          <button onClick={() => setBankModalOpen(false)} style={{ flex: 1, padding: "12px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer", fontWeight: "500", fontSize: isMobile ? "13px" : "14px" }}>
            {tCommon.cancel}
          </button>
        </div>
      </Modal>
    </div>
  );
}