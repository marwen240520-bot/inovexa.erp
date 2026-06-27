"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";
import ImportButton from "@/components/ui/ImportButton";

// --- SVG ICONS ----------------------------------------------------------------
const Icons = {
  Invoice: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Check: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Clock: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertTriangle: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  DollarSign: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  ArrowUpRight: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"/>
      <polyline points="7 7 17 7 17 17"/>
    </svg>
  ),
  ArrowDownLeft: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="7" x2="7" y2="17"/>
      <polyline points="17 17 7 17 7 7"/>
    </svg>
  ),
  TrendingUp: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Percent: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  Calendar: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  BarChart2: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Filter: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Upload: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Plus: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Eye: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  CreditCard: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  FileText: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Edit: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash2: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Printer: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  X: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Save: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Loader: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  CheckCircle: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Mail: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Phone: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.73 2.02z"/>
    </svg>
  ),
};

const defaultFormState = {
  reference: "",
  type: "debit",
  clientId: "",
  supplierId: "",
  clientName: "",
  supplierName: "",
  clientEmail: "",
  clientAddress: "",
  clientPhone: "",
  clientSiret: "",
  description: "",
  amount: 0,
  taxRate: 20,
  dueDate: "",
  paymentTerms: "Net 30",
  notes: "",
  items: [{ id: Date.now(), description: "", quantity: 1, unitPriceHT: 0, totalHT: 0, totalTTC: 0 }]
};

const defaultEditFormState = {
  reference: "",
  type: "debit",
  clientId: "",
  supplierId: "",
  clientName: "",
  supplierName: "",
  clientEmail: "",
  clientAddress: "",
  clientPhone: "",
  clientSiret: "",
  description: "",
  amount: 0,
  taxRate: 20,
  dueDate: "",
  paymentTerms: "Net 30",
  notes: "",
  status: "pending",
  items: [{ id: Date.now(), description: "", quantity: 1, unitPriceHT: 0, totalHT: 0, totalTTC: 0 }]
};

const translations = {
  fr: {
    title: "Facturation",
    subtitle: "Gestion de vos factures professionnelles",
    add: "Créer une facture",
    import: "Importer",
    filters: "Filtres",
    search: "Rechercher",
    reference: "Référence",
    operationNumber: "N° d'opération",
    type: "Type",
    clientSupplier: "Client / Fournisseur",
    amount: "Montant TTC",
    status: "Statut",
    dueDate: "Date d'échéance",
    actions: "Actions",
    paid: "Réglée",
    pending: "En attente",
    overdue: "En retard",
    debit: "Facture client",
    credit: "Avoir fournisseur",
    view: "Consulter",
    pay: "Régler",
    pdf: "Exporter PDF",
    print: "Imprimer",
    edit: "Modifier",
    delete: "Supprimer",
    newInvoice: "Nouvelle facture",
    editInvoice: "Modifier la facture",
    referenceRequired: "La référence est requise",
    clientRequired: "Le client est requis",
    supplierRequired: "Le fournisseur est requis",
    create: "Créer",
    save: "Enregistrer",
    cancel: "Annuler",
    close: "Fermer",
    loading: "Chargement...",
    total: "Total",
    paidInvoices: "Factures réglées",
    pendingInvoices: "Factures impayées",
    totalAmount: "Montant total",
    thisMonth: "Ce mois-ci",
    thisQuarter: "Ce trimestre",
    thisYear: "Cette année",
    lines: "Lignes",
    description: "Description",
    qty: "Qté",
    unitPriceHT: "Prix unitaire HT",
    subtotalHT: "Sous-total HT",
    subtotalTTC: "Sous-total TTC",
    tax: "TVA",
    totalHT: "Total HT",
    totalTTC: "Total TTC",
    dueDateLabel: "Date d'échéance",
    paymentTerms: "Conditions de réglement",
    notes: "Observations",
    thankYou: "Merci pour votre confiance",
    invoice: "FACTURE",
    details: "DéTAILS",
    client: "CLIENT",
    supplier: "FOURNISSEUR",
    dateLabel: "Date",
    noInvoices: "Aucune facture disponible",
    noResults: "Aucun résultat trouvé",
    selectLabel: "Sélectionner",
    allLabel: "Tous",
    newClientLabel: "Nouveau client",
    newSupplierLabel: "Nouveau fournisseur",
    addLine: "Ajouter une ligne",
    taxAmount: "Montant TVA",
    itemsCount: "articles",
    productsList: "Détail des prestations",
    invoiceNumber: "Facture n°",
    generatedOn: "émise le",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout désélectionner",
    selectedCount: "sélectionnée(s)"
  },
  en: {
    title: "Invoices",
    subtitle: "Manage your business invoices",
    add: "Create Invoice",
    import: "Import",
    filters: "Filters",
    search: "Search",
    reference: "Reference",
    operationNumber: "Operation No.",
    type: "Type",
    clientSupplier: "Client / Supplier",
    amount: "Amount incl. VAT",
    status: "Status",
    dueDate: "Due Date",
    actions: "Actions",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    debit: "Customer Invoice",
    credit: "Supplier Credit Note",
    view: "View",
    pay: "Process Payment",
    pdf: "Export PDF",
    print: "Print",
    edit: "Edit",
    delete: "Delete",
    newInvoice: "New Invoice",
    editInvoice: "Edit Invoice",
    referenceRequired: "Reference is required",
    clientRequired: "Client is required",
    supplierRequired: "Supplier is required",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    loading: "Loading...",
    total: "Total",
    paidInvoices: "Paid Invoices",
    pendingInvoices: "Outstanding Invoices",
    totalAmount: "Total Amount",
    thisMonth: "This Month",
    thisQuarter: "This Quarter",
    thisYear: "This Year",
    lines: "Line Items",
    description: "Description",
    qty: "Qty",
    unitPriceHT: "Unit Price (Excl. VAT)",
    subtotalHT: "Subtotal (Excl. VAT)",
    subtotalTTC: "Subtotal (Incl. VAT)",
    tax: "VAT",
    totalHT: "Total (Excl. VAT)",
    totalTTC: "Total (Incl. VAT)",
    dueDateLabel: "Due Date",
    paymentTerms: "Payment Terms",
    notes: "Notes",
    thankYou: "Thank you for your trust",
    invoice: "INVOICE",
    details: "DETAILS",
    client: "CLIENT",
    supplier: "SUPPLIER",
    dateLabel: "Date",
    noInvoices: "No invoices available",
    noResults: "No results found",
    selectLabel: "Select",
    allLabel: "All",
    newClientLabel: "New Client",
    newSupplierLabel: "New Supplier",
    addLine: "Add Line Item",
    taxAmount: "VAT Amount",
    itemsCount: "items",
    productsList: "Service Details",
    invoiceNumber: "Invoice No.",
    generatedOn: "Issued on",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    selectedCount: "selected"
  },
  es: {
    title: "Facturacién",
    subtitle: "Gestién de facturas empresariales",
    add: "Crear factura",
    import: "Importar",
    filters: "Filtros",
    search: "Buscar",
    reference: "Referencia",
    operationNumber: "N.é de operacién",
    type: "Tipo",
    clientSupplier: "Cliente / Proveedor",
    amount: "Importe con IVA",
    status: "Estado",
    dueDate: "Fecha de vencimiento",
    actions: "Acciones",
    paid: "Pagada",
    pending: "Pendiente",
    overdue: "Vencida",
    debit: "Factura de cliente",
    credit: "Nota de abono proveedor",
    view: "Ver",
    pay: "Registrar pago",
    pdf: "Exportar PDF",
    print: "Imprimir",
    edit: "Editar",
    delete: "Eliminar",
    newInvoice: "Nueva factura",
    editInvoice: "Editar factura",
    referenceRequired: "La referencia es obligatoria",
    clientRequired: "El cliente es obligatorio",
    supplierRequired: "El proveedor es obligatorio",
    create: "Crear",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    loading: "Cargando...",
    total: "Total",
    paidInvoices: "Facturas pagadas",
    pendingInvoices: "Facturas pendientes",
    totalAmount: "Importe total",
    thisMonth: "Este mes",
    thisQuarter: "Este trimestre",
    thisYear: "Este aéo",
    lines: "Léneas",
    description: "Descripcién",
    qty: "Cant.",
    unitPriceHT: "Precio unitario (sin IVA)",
    subtotalHT: "Subtotal (sin IVA)",
    subtotalTTC: "Subtotal (con IVA)",
    tax: "IVA",
    totalHT: "Total sin IVA",
    totalTTC: "Total con IVA",
    dueDateLabel: "Fecha de vencimiento",
    paymentTerms: "Condiciones de pago",
    notes: "Observaciones",
    thankYou: "Gracias por su confianza",
    invoice: "FACTURA",
    details: "DETALLES",
    client: "CLIENTE",
    supplier: "PROVEEDOR",
    dateLabel: "Fecha",
    noInvoices: "No hay facturas disponibles",
    noResults: "No se encontraron resultados",
    selectLabel: "Seleccionar",
    allLabel: "Todos",
    newClientLabel: "Nuevo cliente",
    newSupplierLabel: "Nuevo proveedor",
    addLine: "Agregar lénea",
    taxAmount: "Importe IVA",
    itemsCount: "artéculos",
    productsList: "Detalle de servicios",
    invoiceNumber: "Factura n.é",
    generatedOn: "Emitida el",
    selectAll: "Seleccionar todo",
    deselectAll: "Deseleccionar todo",
    selectedCount: "seleccionada(s)"
  }
};

const animations = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @media print {
    .no-print { display: none !important; }
    .print-area { ; padding: 0; }
    body { background: white; }
  }
`;

export default function InvoicesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const contentMarginLeft = isMobile ? "0" : "0px";
  const t = translations[language as keyof typeof translations] || translations.fr;
  const printRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperationNumbers, setSelectedOperationNumbers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ ...defaultFormState });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalForm, setEditModalForm] = useState({ ...defaultEditFormState });
  const [editOperationNumber, setEditOperationNumber] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [quickFilters, setQuickFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    clientFilter: "all"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0, paid: 0, pending: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalTax: 0, debitTotal: 0, creditTotal: 0,
    monthlyTotal: 0, quarterlyTotal: 0, yearlyTotal: 0
  });

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "8px" : "12px";
  const cardRadius = isMobile ? "10px" : "14px";
  const gridGap = isMobile ? "8px" : "12px";
  const sectionMargin = isMobile ? "16px" : "24px";
  const tableFontSize = isMobile ? "10px" : "12px";
  const statusFontSize = isMobile ? "8px" : "10px";
  const buttonPadding = isMobile ? "4px 8px" : "6px 12px";
  const modalWidth = isMobile ? "95%" : "900px";
  const modalPadding = isMobile ? "16px" : "24px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchInvoices();
    fetchClients();
    fetchSuppliers();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      const formattedData = data.map((inv: any) => ({
        ...inv,
        items: inv.items && Array.isArray(inv.items) ? inv.items : [],
        subtotalHT: inv.subtotalHT || inv.subtotal || 0,
        taxAmount: inv.taxAmount || (inv.amount * (inv.taxRate || 20) / 100) || 0,
        amount: inv.amount || 0,
        createdAt: inv.createdAt || new Date().toISOString()
      }));
      setInvoices(formattedData);
      calculateStats(formattedData);
    } catch (e) {
      console.error("Erreur fetch invoices:", e);
    }
    setLoading(false);
  };

  const calculateStats = (data: any[]) => {
    const totalAmount = data.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const paidAmount = data.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const totalTax = data.reduce((s: number, i: any) => s + (Number(i.taxAmount) || 0), 0);
    const debitTotal = data.filter((i: any) => i.type === "debit").reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const creditTotal = data.filter((i: any) => i.type === "credit").reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const monthlyTotal = data.filter((i: any) => {
      if (!i.createdAt) return false;
      const date = new Date(i.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const quarterlyTotal = data.filter((i: any) => {
      if (!i.createdAt) return false;
      const date = new Date(i.createdAt);
      return Math.floor(date.getMonth() / 3) === currentQuarter && date.getFullYear() === currentYear;
    }).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const yearlyTotal = data.filter((i: any) => {
      if (!i.createdAt) return false;
      const date = new Date(i.createdAt);
      return date.getFullYear() === currentYear;
    }).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    setStats({
      total: data.length,
      paid: data.filter((i: any) => i.status === "paid").length,
      pending: data.filter((i: any) => i.status !== "paid").length,
      totalAmount, paidAmount,
      pendingAmount: totalAmount - paidAmount,
      totalTax, debitTotal, creditTotal,
      monthlyTotal, quarterlyTotal, yearlyTotal
    });
  };

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchSuppliers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const generateOperationNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const day = String(new Date().getDate()).padStart(2, "0");
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `FACT-${year}${month}${day}-${random}`;
  };

  const calculateItemTotalHT = (quantity: number, unitPriceHT: number) => (quantity || 0) * (unitPriceHT || 0);
  const calculateItemTotalTTC = (totalHT: number, taxRate: number) => totalHT * (1 + (taxRate || 20) / 100);
  const calculateSubtotalHT = (items: any[]) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.totalHT || 0), 0);
  };
  const calculateTotalTTC = (subtotalHT: number, taxRate: number) => subtotalHT * (1 + (taxRate || 20) / 100);
  const calculateTaxAmount = (subtotalHT: number, taxRate: number) => subtotalHT * ((taxRate || 20) / 100);

  const addInvoiceItem = (isEdit: boolean = false) => {
    const newItem = { id: Date.now(), description: "", quantity: 1, unitPriceHT: 0, totalHT: 0, totalTTC: 0 };
    if (isEdit) {
      const currentItems = editModalForm.items && Array.isArray(editModalForm.items) ? [...editModalForm.items] : [];
      setEditModalForm({ ...editModalForm, items: [...currentItems, newItem] });
    } else {
      const currentItems = modalForm.items && Array.isArray(modalForm.items) ? [...modalForm.items] : [];
      setModalForm({ ...modalForm, items: [...currentItems, newItem] });
    }
  };

  const removeInvoiceItem = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const currentItems = editModalForm.items && Array.isArray(editModalForm.items) ? [...editModalForm.items] : [];
      currentItems.splice(index, 1);
      setEditModalForm({ ...editModalForm, items: currentItems });
    } else {
      const currentItems = modalForm.items && Array.isArray(modalForm.items) ? [...modalForm.items] : [];
      currentItems.splice(index, 1);
      setModalForm({ ...modalForm, items: currentItems });
    }
  };

  const updateInvoiceItem = (index: number, field: string, value: any, isEdit: boolean = false) => {
    const taxRate = isEdit ? (Number(editModalForm.taxRate) || 20) : (Number(modalForm.taxRate) || 20);
    if (isEdit) {
      const currentItems = editModalForm.items && Array.isArray(editModalForm.items) ? [...editModalForm.items] : [];
      if (!currentItems[index]) return;
      currentItems[index][field] = value;
      if (field === "quantity" || field === "unitPriceHT") {
        currentItems[index].totalHT = calculateItemTotalHT(currentItems[index].quantity, currentItems[index].unitPriceHT);
        currentItems[index].totalTTC = calculateItemTotalTTC(currentItems[index].totalHT, taxRate);
      }
      setEditModalForm({ ...editModalForm, items: currentItems });
    } else {
      const currentItems = modalForm.items && Array.isArray(modalForm.items) ? [...modalForm.items] : [];
      if (!currentItems[index]) return;
      currentItems[index][field] = value;
      if (field === "quantity" || field === "unitPriceHT") {
        currentItems[index].totalHT = calculateItemTotalHT(currentItems[index].quantity, currentItems[index].unitPriceHT);
        currentItems[index].totalTTC = calculateItemTotalTTC(currentItems[index].totalHT, taxRate);
      }
      setModalForm({ ...modalForm, items: currentItems });
    }
  };

  const importInvoices = async (data: any[]) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      for (const invoice of data) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(invoice)
        });
      }
      await fetchInvoices();
      showMessage(`${data.length} facture(s) importée(s)`, "success");
    } catch (e) {
      console.error("Erreur import:", e);
      showMessage("Erreur lors de l'import", "error");
    }
    setLoading(false);
  };

  const createInvoice = async () => {
    const token = localStorage.getItem("token");
    try {
      if (!modalForm.reference?.trim()) { showMessage(t.referenceRequired, "error"); return; }
      if (modalForm.type === "debit" && !modalForm.clientId && !modalForm.clientName) { showMessage(t.clientRequired, "error"); return; }
      if (modalForm.type === "credit" && !modalForm.supplierId && !modalForm.supplierName) { showMessage(t.supplierRequired, "error"); return; }
      const validItems = (modalForm.items || []).filter(item => item.description?.trim() && item.quantity > 0);
      if (validItems.length === 0) { showMessage("Ajoutez au moins un produit", "error"); return; }
      const taxRate = Number(modalForm.taxRate) || 20;
      const itemsWithTotals = validItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceHT: item.unitPriceHT,
        totalHT: calculateItemTotalHT(item.quantity, item.unitPriceHT),
        totalTTC: calculateItemTotalTTC(calculateItemTotalHT(item.quantity, item.unitPriceHT), taxRate)
      }));
      const subtotalHT = calculateSubtotalHT(itemsWithTotals);
      const taxAmount = calculateTaxAmount(subtotalHT, taxRate);
      const totalTTC = calculateTotalTTC(subtotalHT, taxRate);
      const operationNumber = generateOperationNumber();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reference: modalForm.reference,
          operationNumber,
          type: modalForm.type,
          clientId: modalForm.type === "debit" ? (modalForm.clientId || null) : null,
          supplierId: modalForm.type === "credit" ? (modalForm.supplierId || null) : null,
          clientName: modalForm.type === "debit" ? (modalForm.clientName || null) : null,
          supplierName: modalForm.type === "credit" ? (modalForm.supplierName || null) : null,
          clientEmail: modalForm.clientEmail || null,
          clientAddress: modalForm.clientAddress || null,
          clientPhone: modalForm.clientPhone || null,
          clientSiret: modalForm.clientSiret || null,
          description: modalForm.description || "",
          items: itemsWithTotals,
          subtotalHT,
          amount: totalTTC,
          taxRate,
          taxAmount,
          dueDate: modalForm.dueDate,
          paymentTerms: modalForm.paymentTerms || "Net 30",
          notes: modalForm.notes || "",
          status: "pending",
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setModalOpen(false);
        setModalForm({ ...defaultFormState });
        await fetchInvoices();
        showMessage(`Facture créée avec ${validItems.length} article(s)`, "success");
      } else {
        const error = await res.json();
        showMessage(error.message || "Erreur lors de la création", "error");
      }
    } catch (e) {
      console.error("Erreur création:", e);
      showMessage("Erreur lors de la création", "error");
    }
  };

  const updateInvoice = async () => {
    const token = localStorage.getItem("token");
    try {
      if (!editModalForm.reference?.trim()) { showMessage(t.referenceRequired, "error"); return; }
      const validItems = (editModalForm.items || []).filter(item => item.description?.trim() && item.quantity > 0);
      if (validItems.length === 0) { showMessage("Ajoutez au moins un produit", "error"); return; }
      const taxRate = Number(editModalForm.taxRate) || 20;
      const itemsWithTotals = validItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceHT: item.unitPriceHT,
        totalHT: calculateItemTotalHT(item.quantity, item.unitPriceHT),
        totalTTC: calculateItemTotalTTC(calculateItemTotalHT(item.quantity, item.unitPriceHT), taxRate)
      }));
      const subtotalHT = calculateSubtotalHT(itemsWithTotals);
      const taxAmount = calculateTaxAmount(subtotalHT, taxRate);
      const totalTTC = calculateTotalTTC(subtotalHT, taxRate);
      const invoiceToUpdate = invoices.find(inv => inv.operationNumber === editOperationNumber);
      if (!invoiceToUpdate) { showMessage("Facture non trouvée", "error"); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceToUpdate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reference: editModalForm.reference,
          type: editModalForm.type,
          clientId: editModalForm.type === "debit" ? (editModalForm.clientId || null) : null,
          supplierId: editModalForm.type === "credit" ? (editModalForm.supplierId || null) : null,
          clientName: editModalForm.type === "debit" ? editModalForm.clientName : null,
          supplierName: editModalForm.type === "credit" ? editModalForm.supplierName : null,
          clientEmail: editModalForm.clientEmail || null,
          clientAddress: editModalForm.clientAddress || null,
          clientPhone: editModalForm.clientPhone || null,
          clientSiret: editModalForm.clientSiret || null,
          description: editModalForm.description || "",
          items: itemsWithTotals,
          subtotalHT,
          amount: totalTTC,
          taxRate,
          taxAmount,
          dueDate: editModalForm.dueDate,
          paymentTerms: editModalForm.paymentTerms,
          notes: editModalForm.notes,
          status: editModalForm.status
        })
      });
      if (res.ok) {
        setEditModalOpen(false);
        setEditModalForm({ ...defaultEditFormState });
        setEditOperationNumber(null);
        await fetchInvoices();
        showMessage(`Facture modifiée avec ${validItems.length} article(s)`, "success");
      } else {
        const error = await res.json();
        showMessage(error.message || "Erreur lors de la modification", "error");
      }
    } catch (e) {
      console.error("Erreur modification:", e);
      showMessage("Erreur lors de la modification", "error");
    }
  };

  const markAsPaid = async (operationNumber: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/number/${operationNumber}/pay`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchInvoices();
        showMessage("Facture payée", "success");
      } else {
        const invoice = invoices.find(inv => inv.operationNumber === operationNumber);
        if (invoice) {
          const fallbackRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.id}/pay`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (fallbackRes.ok) { await fetchInvoices(); showMessage("Facture payée", "success"); }
        }
      }
    } catch (e) { console.error(e); }
  };

  const deleteInvoice = async (operationNumber: string) => {
    if (confirm("Supprimer cette facture ?")) {
      const token = localStorage.getItem("token");
      const invoice = invoices.find(inv => inv.operationNumber === operationNumber);
      if (invoice) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchInvoices();
        showMessage("Facture supprimée", "success");
        setSelectedOperationNumbers(selectedOperationNumbers.filter(sop => sop !== operationNumber));
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedOperationNumbers.length === 0) return;
    if (confirm(`Supprimer ${selectedOperationNumbers.length} facture(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const operationNumber of selectedOperationNumbers) {
        const invoice = invoices.find(inv => inv.operationNumber === operationNumber);
        if (invoice) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      await fetchInvoices();
      setSelectedOperationNumbers([]);
      showMessage(`${selectedOperationNumbers.length} facture(s) supprimée(s)`, "success");
    }
  };

  const generateInvoicePDF = (invoice: any) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const subtotalHT = Number(invoice.subtotalHT) || 0;
      const taxRate = Number(invoice.taxRate) || 20;
      const taxAmount = Number(invoice.taxAmount) || (subtotalHT * taxRate / 100);
      const totalTTC = Number(invoice.amount) || (subtotalHT + taxAmount);
      const items = invoice.items && invoice.items.length > 0 ? invoice.items : [];
      const clientInfo = invoice.type === "debit" ? invoice.clientName : invoice.supplierName;
      const dateObj = new Date(invoice.createdAt);
      const dueDateObj = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Facture ${invoice.reference}</title>
            <meta charset="UTF-8">
            <style>
              * { ; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, Helvetica, sans-serif; background: white; padding: 40px; color: #000; }
              .invoice-container { max-width: 900px; auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
              .company-info { display: flex; align-items: center; gap: 15px; }
              .logo-img { width: 150px; height: 150px; object-fit: contain; }
              .company-info h1 { color: #667eea; font-size: 26px; margin-bottom: 6px; }
              .company-info p { color: #333; font-size: 12px; line-height: 1.5; }
              .invoice-title h2 { color: #667eea; font-size: 30px; text-align: right; }
              .invoice-title .badge { background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; display: inline-block; margin-top: 8px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
              .info-box h4 { color: #667eea; font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
              .info-box p { color: #111; font-size: 13px; line-height: 1.6; margin: 3px 0; }
              .section-title { color: #111; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .items-table th { background: #667eea; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
              .items-table th.right { text-align: right; }
              .items-table td { padding: 9px 12px; border-bottom: 1px solid #e0e0e0; font-size: 12px; color: #111; }
              .items-table td.right { text-align: right; }
              .totals { width: 320px; margin-left: auto; margin-bottom: 30px; }
              .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; color: #111; }
              .totals-row.total { border-top: 2px solid #667eea; margin-top: 8px; padding-top: 12px; font-weight: bold; font-size: 16px; color: #111; }
              .notes-box { background: #f5f5f5; padding: 14px; border-radius: 8px; margin-bottom: 20px; }
              .notes-box p { font-size: 12px; color: #111; line-height: 1.5; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #333; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <div class="company-info">
                  <img src="/images/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'" />
                  <div>
                    <h1>INOVEXA ERP</h1>
                    <p>Solution ERP compléte</p>
                  </div>
                </div>
                <div class="invoice-title">
                  <h2>${t.invoice}</h2>
                  <div class="badge">${invoice.status === "paid" ? "PAYéE" : invoice.status === "pending" ? "EN ATTENTE" : "EN RETARD"}</div>
                </div>
              </div>
              <div class="info-grid">
                <div class="info-box">
                  <h4>${invoice.type === "debit" ? t.client : t.supplier}</h4>
                  <p><strong>${clientInfo || "-"}</strong></p>
                  ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ""}
                  ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ""}
                  ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ""}
                  ${invoice.clientSiret ? `<p>SIRET: ${invoice.clientSiret}</p>` : ""}
                </div>
                <div class="info-box">
                  <h4>${t.details}</h4>
                  <p><strong>${t.invoiceNumber}:</strong> ${invoice.reference}</p>
                  <p><strong>${t.operationNumber}:</strong> ${invoice.operationNumber}</p>
                  <p><strong>${t.dateLabel}:</strong> ${dateObj.toLocaleDateString(locale)}</p>
                  <p><strong>${t.dueDateLabel}:</strong> ${dueDateObj ? dueDateObj.toLocaleDateString(locale) : "-"}</p>
                  ${invoice.paymentTerms ? `<p><strong>${t.paymentTerms}:</strong> ${invoice.paymentTerms}</p>` : ""}
                </div>
              </div>
              <p class="section-title">${t.productsList}</p>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="color: #000;">${t.description}</th>
                    <th class="right" style="width:70px;color: #000;">${t.qty}</th>
                    <th class="right" style="width:130px;color: #000;">${t.unitPriceHT}</th>
                    <th class="right" style="width:130px;color: #000;">${t.subtotalHT}</th>
                    <th class="right" style="width:130px;color: #000;">${t.subtotalTTC}</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length > 0 ? items.map((item: any) => {
                    const itemHT = item.totalHT || (item.quantity * item.unitPriceHT) || 0;
                    const itemTTC = item.totalTTC || (itemHT * (1 + taxRate / 100)) || 0;
                    return `<tr>
                      <td>${item.description || "-"}</td>
                      <td class="right">${item.quantity || 1}</td>
                      <td class="right">${formatCurrency(item.unitPriceHT || 0)}</td>
                      <td class="right">${formatCurrency(itemHT)}</td>
                      <td class="right">${formatCurrency(itemTTC)}</td>
                    </tr>`;
                  }).join("") : `<tr><td colspan="5" style="text-align:center;padding:30px;color:#555;">Aucun article</td></tr>`}
                </tbody>
              </table>
              <div class="totals">
                <div class="totals-row"><span>${t.totalHT}</span><span>${formatCurrency(subtotalHT)}</span></div>
                <div class="totals-row"><span>${t.tax} (${taxRate}%)</span><span>${formatCurrency(taxAmount)}</span></div>
                <div class="totals-row total"><span>${t.totalTTC}</span><span>${formatCurrency(totalTTC)}</span></div>
              </div>
              ${invoice.notes ? `<div class="notes-box"><p><strong>${t.notes}:</strong> ${invoice.notes}</p></div>` : ""}
              <div class="footer">
                <p>${t.thankYou}</p>
                <p style="margin-top:5px;color:#555;">INOVEXA ERP</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const openEditModal = (invoice: any) => {
    const items = invoice.items && invoice.items.length > 0
      ? invoice.items.map((item: any, idx: number) => ({
          id: Date.now() + idx,
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPriceHT: item.unitPriceHT || 0,
          totalHT: item.totalHT || (item.quantity * item.unitPriceHT) || 0,
          totalTTC: item.totalTTC || ((item.totalHT || (item.quantity * item.unitPriceHT)) * (1 + (invoice.taxRate || 20) / 100)) || 0
        }))
      : [{ id: Date.now(), description: "", quantity: 1, unitPriceHT: 0, totalHT: 0, totalTTC: 0 }];
    setEditOperationNumber(invoice.operationNumber);
    setEditModalForm({
      reference: invoice.reference || "",
      type: invoice.type || "debit",
      clientId: invoice.clientId || "",
      supplierId: invoice.supplierId || "",
      clientName: invoice.clientName || "",
      supplierName: invoice.supplierName || "",
      clientEmail: invoice.clientEmail || "",
      clientAddress: invoice.clientAddress || "",
      clientPhone: invoice.clientPhone || "",
      clientSiret: invoice.clientSiret || "",
      description: invoice.description || "",
      amount: invoice.subtotalHT || 0,
      taxRate: invoice.taxRate || 20,
      dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : "",
      paymentTerms: invoice.paymentTerms || "Net 30",
      notes: invoice.notes || "",
      status: invoice.status || "pending",
      items
    });
    setEditModalOpen(true);
  };

  const openViewModal = (invoice: any) => {
    setViewInvoice(invoice);
    setShowPreviewModal(true);
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openCreateModal = () => {
    setModalForm({
      ...defaultFormState,
      items: [{ id: Date.now(), description: "", quantity: 1, unitPriceHT: 0, totalHT: 0, totalTTC: 0 }]
    });
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    if (status === "paid") return "#10b981";
    if (status === "pending") return "#f59e0b";
    if (status === "overdue") return "#ef4444";
    return theme.textSecondary;
  };

  const getStatusText = (status: string) => {
    if (status === "paid") return t.paid;
    if (status === "pending") return t.pending;
    if (status === "overdue") return t.overdue;
    return status;
  };

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <Icons.Check size={10} color="#10b981" />;
    if (status === "pending") return <Icons.Clock size={10} color="#f59e0b" />;
    if (status === "overdue") return <Icons.AlertTriangle size={10} color="#ef4444" />;
    return <Icons.Invoice size={10} />;
  };

  const getTypeIcon = (type: string) => type === "debit"
    ? <Icons.ArrowUpRight size={10} color="#ef4444" />
    : <Icons.ArrowDownLeft size={10} color="#10b981" />;

  const getTypeText = (type: string) => type === "debit" ? t.debit : t.credit;

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).setHours(0, 0, 0, 0) !== new Date().setHours(0, 0, 0, 0);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch =
      (invoice.clientName || invoice.supplierName || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.operationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchType = filterType === "all" || invoice.type === filterType;
    if (filterStatus === "overdue" && !matchStatus) {
      matchStatus = isOverdue(invoice.dueDate) && invoice.status !== "paid";
    }
    const matchClient =
      quickFilters.clientFilter === "all" ||
      (invoice.type === "debit" && invoice.clientName === quickFilters.clientFilter) ||
      (invoice.type === "credit" && invoice.supplierName === quickFilters.clientFilter);
    const matchDate =
      (!quickFilters.startDate || new Date(invoice.createdAt) >= new Date(quickFilters.startDate)) &&
      (!quickFilters.endDate || new Date(invoice.createdAt) <= new Date(quickFilters.endDate));
    const matchAmount =
      (!quickFilters.minAmount || Number(invoice.amount) >= Number(quickFilters.minAmount)) &&
      (!quickFilters.maxAmount || Number(invoice.amount) <= Number(quickFilters.maxAmount));
    return matchSearch && matchStatus && matchType && matchClient && matchDate && matchAmount;
  });

  const getEditSubtotalHT = () => calculateSubtotalHT(editModalForm.items);
  const getEditTaxAmount = () => calculateTaxAmount(getEditSubtotalHT(), Number(editModalForm.taxRate) || 20);
  const getEditTotalTTC = () => calculateTotalTTC(getEditSubtotalHT(), Number(editModalForm.taxRate) || 20);

  const getCreateSubtotalHT = () => {
    const taxRate = Number(modalForm.taxRate) || 20;
    const itemsWithTotals = modalForm.items.map(item => ({
      ...item,
      totalHT: calculateItemTotalHT(item.quantity, item.unitPriceHT),
      totalTTC: calculateItemTotalTTC(calculateItemTotalHT(item.quantity, item.unitPriceHT), taxRate)
    }));
    return calculateSubtotalHT(itemsWithTotals);
  };

  const getCreateTaxAmount = () => calculateTaxAmount(getCreateSubtotalHT(), Number(modalForm.taxRate) || 20);
  const getCreateTotalTTC = () => calculateTotalTTC(getCreateSubtotalHT(), Number(modalForm.taxRate) || 20);

  const statsCards = [
    { icon: <Icons.Invoice size={isMobile ? 14 : 16} color={theme.primary} />, label: t.total, value: stats.total, color: theme.primary },
    { icon: <Icons.CheckCircle size={isMobile ? 14 : 16} color={theme.accent} />, label: t.paidInvoices, value: stats.paid, color: theme.accent },
    { icon: <Icons.Clock size={isMobile ? 14 : 16} color="#f59e0b" />, label: t.pendingInvoices, value: stats.pending, color: "#f59e0b" },
    { icon: <Icons.DollarSign size={isMobile ? 14 : 16} color={theme.accent} />, label: t.totalAmount, value: formatCurrency(stats.totalAmount), color: theme.accent },
    { icon: <Icons.ArrowUpRight size={isMobile ? 14 : 16} color="#ef4444" />, label: t.debit, value: formatCurrency(stats.debitTotal), color: "#ef4444" },
    { icon: <Icons.ArrowDownLeft size={isMobile ? 14 : 16} color={theme.accent} />, label: t.credit, value: formatCurrency(stats.creditTotal), color: theme.accent },
    { icon: <Icons.Check size={isMobile ? 14 : 16} color="#10b981" />, label: t.paid, value: formatCurrency(stats.paidAmount), color: "#10b981" },
    { icon: <Icons.Percent size={isMobile ? 14 : 16} color="#8b5cf6" />, label: t.tax, value: formatCurrency(stats.totalTax), color: "#8b5cf6" }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ animation: "spin 1s linear infinite", display: "inline-block", margin: "0 auto 10px" }}>
            <Icons.Loader size={isMobile ? 28 : 32} color={theme.primary} />
          </div>
          <p style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
<div style={{ marginLeft: contentMarginLeft, flex: 1, padding: isMobile ? "10px" : "16px", paddingBottom: isMobile ? "70px" : "24px", overflowX: "hidden", background: theme.background }}>        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* Header */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.Invoice size={isMobile ? 20 : 26} color={theme.primary} />
                  {t.title}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "2px", fontSize: isMobile ? "10px" : "11px" }}>{t.subtitle}</p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button onClick={() => setShowFilters(!showFilters)} style={{ background: theme.surfaceHover, color: theme.text, padding: buttonPadding, border: `1px solid ${theme.border}`, borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.Filter size={12} color={theme.text} />
                  {isMobile ? "" : t.filters}
                </button>
                <ImportButton onImport={importInvoices} label={
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icons.Upload size={12} />
                    {isMobile ? "" : t.import}
                  </span>
                } />
                <ExportButtons data={filteredInvoices} filename="invoices" />
                <button onClick={openCreateModal} style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.Plus size={13} color="white" />
                  {isMobile ? "" : t.add}
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{ background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`, color: messageType === "success" ? theme.accent : "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "14px", textAlign: "center", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {messageType === "success" ? <Icons.CheckCircle size={14} color={theme.accent} /> : <Icons.XCircle size={14} color="#f87171" />}
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "75px" : "95px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div key={idx} style={{ background: theme.surface, borderRadius: cardRadius, padding: cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.05 + idx * 0.03}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "12px" : "14px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "7px" : "8px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Period Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "80px" : "110px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {[
              { icon: <Icons.Calendar size={isMobile ? 12 : 14} color={theme.primary} />, label: t.thisMonth, value: formatCurrency(stats.monthlyTotal), color: theme.primary },
              { icon: <Icons.BarChart2 size={isMobile ? 12 : 14} color={theme.accent} />, label: t.thisQuarter, value: formatCurrency(stats.quarterlyTotal), color: theme.accent },
              { icon: <Icons.TrendingUp size={isMobile ? 12 : 14} color="#f59e0b" />, label: t.thisYear, value: formatCurrency(stats.yearlyTotal), color: "#f59e0b" }
            ].map((card, idx) => (
              <div key={idx} style={{ background: `linear-gradient(135deg, ${theme.surface}, ${theme.surfaceHover})`, borderRadius: cardRadius, padding: cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.25 + idx * 0.05}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "11px" : "13px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "7px" : "8px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{ background: theme.surface, borderRadius: "10px", padding: "10px", marginBottom: "12px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                <h4 style={{ color: theme.text, fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.Filter size={11} color={theme.text} />
                  {t.filters}
                </h4>
                <button onClick={() => setQuickFilters({ startDate: "", endDate: "", minAmount: "", maxAmount: "", clientFilter: "all" })} style={{ background: "none", border: "none", color: theme.primary, cursor: "pointer", fontSize: "9px" }}>Reset</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "6px" }}>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: "8px", display: "block", marginBottom: "2px" }}>Date debut</label>
                  <input type="date" value={quickFilters.startDate} onChange={e => setQuickFilters({ ...quickFilters, startDate: e.target.value })} style={{ width: "100%", padding: "4px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "10px" }} />
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: "8px", display: "block", marginBottom: "2px" }}>Date fin</label>
                  <input type="date" value={quickFilters.endDate} onChange={e => setQuickFilters({ ...quickFilters, endDate: e.target.value })} style={{ width: "100%", padding: "4px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "10px" }} />
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: "8px", display: "block", marginBottom: "2px" }}>Min (é)</label>
                  <input type="number" placeholder="0" value={quickFilters.minAmount} onChange={e => setQuickFilters({ ...quickFilters, minAmount: e.target.value })} style={{ width: "100%", padding: "4px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "10px" }} />
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: "8px", display: "block", marginBottom: "2px" }}>Max (é)</label>
                  <input type="number" placeholder="999999" value={quickFilters.maxAmount} onChange={e => setQuickFilters({ ...quickFilters, maxAmount: e.target.value })} style={{ width: "100%", padding: "4px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "10px" }} />
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div style={{ marginBottom: "12px", animation: `fadeInUp 0.5s ease 0.4s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "8px", display: "flex", alignItems: "center" }}>
                  <Icons.Search size={13} color={theme.textSecondary} />
                </span>
                <input type="text" placeholder={`${t.search}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "5px 8px 5px 28px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "5px", color: theme.text, fontSize: isMobile ? "10px" : "11px" }} />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "5px 8px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "5px", color: theme.text, minWidth: isMobile ? "100%" : "100px", cursor: "pointer", fontSize: isMobile ? "10px" : "11px" }}>
                <option value="all">{t.type} - {t.allLabel}</option>
                <option value="debit">{t.debit}</option>
                <option value="credit">{t.credit}</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "5px 8px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "5px", color: theme.text, minWidth: isMobile ? "100%" : "110px", cursor: "pointer", fontSize: isMobile ? "10px" : "11px" }}>
                <option value="all">{t.status} - {t.allLabel}</option>
                <option value="paid">{t.paid}</option>
                <option value="pending">{t.pending}</option>
                <option value="overdue">{t.overdue}</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", flexWrap: "wrap", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedOperationNumbers.length === filteredInvoices.length}
                    ref={(input) => {
                      if (input) {
                        const someSelected = selectedOperationNumbers.length > 0 && selectedOperationNumbers.length < filteredInvoices.length;
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={() => {
                      if (selectedOperationNumbers.length === filteredInvoices.length) {
                        setSelectedOperationNumbers([]);
                      } else {
                        setSelectedOperationNumbers(filteredInvoices.map(i => i.operationNumber));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "11px", color: theme.textSecondary }}>
                    {selectedOperationNumbers.length === filteredInvoices.length && filteredInvoices.length > 0 ? t.deselectAll : t.selectAll}
                  </span>
                </label>
                {selectedOperationNumbers.length > 0 && (
                  <span style={{ fontSize: "10px", color: theme.textSecondary, opacity: 0.7 }}>
                    ({selectedOperationNumbers.length} {t.selectedCount})
                  </span>
                )}
              </div>
              {selectedOperationNumbers.length > 0 && (
                <button onClick={deleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: isMobile ? "9px" : "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.Trash2 size={11} color="white" />
                  {t.delete} ({selectedOperationNumbers.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: theme.surface, borderRadius: "12px", padding: "8px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: `fadeInUp 0.5s ease 0.5s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "800px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: tableFontSize }}>
                    <th style={{ padding: "5px", width: "25px" }}>
                      <input type="checkbox" checked={selectedOperationNumbers.length === filteredInvoices.length && filteredInvoices.length > 0} onChange={() => { if (selectedOperationNumbers.length === filteredInvoices.length) setSelectedOperationNumbers([]); else setSelectedOperationNumbers(filteredInvoices.map(i => i.operationNumber)); }} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                    </th>
                    <th style={{ padding: "5px", textAlign: "left" }}>{t.reference}</th>
                    <th style={{ padding: "5px", textAlign: "left" }}>{t.operationNumber}</th>
                    <th style={{ padding: "5px", textAlign: "center" }}>{t.type}</th>
                    <th style={{ padding: "5px", textAlign: "left" }}>{t.clientSupplier}</th>
                    {!isMobile && <th style={{ padding: "5px", textAlign: "left" }}>{t.description}</th>}
                    <th style={{ padding: "5px", textAlign: "right" }}>{t.amount}</th>
                    <th style={{ padding: "5px", textAlign: "center" }}>{t.status}</th>
                    <th style={{ padding: "5px", textAlign: "left" }}>{t.dueDate}</th>
                    <th style={{ padding: "5px", textAlign: "center" }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, idx) => {
                    const isInvoiceOverdue = isOverdue(invoice.dueDate) && invoice.status !== "paid";
                    const displayStatus = isInvoiceOverdue ? "overdue" : invoice.status;
                    const statusColor = getStatusColor(displayStatus);
                    const statusText = getStatusText(displayStatus);
                    const statusIcon = getStatusIcon(displayStatus);
                    const partyName = invoice.type === "debit" ? invoice.clientName : invoice.supplierName;
                    const itemCount = invoice.items?.length || 0;
                    const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
                    return (
                      <tr key={invoice.operationNumber} style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s`, background: isInvoiceOverdue ? "rgba(239,68,68,0.05)" : "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isInvoiceOverdue ? "rgba(239,68,68,0.1)" : theme.surfaceHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isInvoiceOverdue ? "rgba(239,68,68,0.05)" : "transparent")}>
                        <td style={{ padding: "5px", textAlign: "center" }}>
                          <input type="checkbox" checked={selectedOperationNumbers.includes(invoice.operationNumber)} onChange={() => { if (selectedOperationNumbers.includes(invoice.operationNumber)) { setSelectedOperationNumbers(selectedOperationNumbers.filter(op => op !== invoice.operationNumber)); } else { setSelectedOperationNumbers([...selectedOperationNumbers, invoice.operationNumber]); } }} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                        </td>
                        <td style={{ padding: "5px", color: theme.text, fontWeight: "500", fontFamily: "monospace", fontSize: isMobile ? "9px" : "10px" }}>
                          {invoice.reference}
                          <span style={{ fontSize: "7px", color: "#666", marginLeft: "4px" }}>({itemCount})</span>
                        </td>
                        <td style={{ padding: "5px", color: theme.textSecondary, fontFamily: "monospace", fontSize: isMobile ? "8px" : "9px" }}>{invoice.operationNumber}</td>
                        <td style={{ padding: "5px", textAlign: "center" }}>
                          <span style={{ background: invoice.type === "debit" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)", color: invoice.type === "debit" ? "#ef4444" : "#10b981", padding: "2px 5px", borderRadius: "8px", fontSize: isMobile ? "7px" : "9px", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            {getTypeIcon(invoice.type)} {getTypeText(invoice.type)}
                          </span>
                        </td>
                        <td style={{ padding: "5px", color: theme.textSecondary, fontSize: isMobile ? "9px" : "10px" }}>
                          {partyName?.length > (isMobile ? 15 : 20) ? partyName.substring(0, isMobile ? 12 : 17) + "..." : partyName || "-"}
                        </td>
                        {!isMobile && (
                          <td style={{ padding: "5px", color: theme.textSecondary, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>
                            {invoice.description?.length > 30 ? invoice.description.substring(0, 27) + "..." : invoice.description || "-"}
                          </td>
                        )}
                        <td style={{ padding: "5px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "10px" : "11px" }}>
                          {formatCurrency(Number(invoice.amount))}
                        </td>
                        <td style={{ padding: "5px", textAlign: "center" }}>
                          <span style={{ background: statusColor + "20", color: statusColor, padding: "2px 5px", borderRadius: "8px", fontSize: statusFontSize, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            {statusIcon} {statusText}
                          </span>
                        </td>
                        <td style={{ padding: "5px", color: isInvoiceOverdue ? "#ef4444" : theme.textSecondary, fontWeight: isInvoiceOverdue ? "bold" : "normal", fontSize: isMobile ? "8px" : "9px" }}>
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(locale) : "-"}
                          {isInvoiceOverdue && (
                            <span style={{ marginLeft: "3px", display: "inline-flex", verticalAlign: "middle" }}>
                              <Icons.AlertTriangle size={9} color="#ef4444" />
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "5px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "3px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button onClick={() => openViewModal(invoice)} style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.view}>
                              <Icons.Eye size={12} color="white" />
                            </button>
                            {invoice.status !== "paid" && (
                              <button onClick={() => markAsPaid(invoice.operationNumber)} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "4px", padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.pay}>
                                <Icons.CreditCard size={12} color="white" />
                              </button>
                            )}
                            <button onClick={() => generateInvoicePDF(invoice)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "4px", padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.pdf}>
                              <Icons.FileText size={12} color="white" />
                            </button>
                            <button onClick={() => openEditModal(invoice)} style={{ background: "#667eea", color: "white", border: "none", borderRadius: "4px", padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.edit}>
                              <Icons.Edit size={12} color="white" />
                            </button>
                            <button onClick={() => deleteInvoice(invoice.operationNumber)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "4px", padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.delete}>
                              <Icons.Trash2 size={12} color="white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredInvoices.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", opacity: 0.3 }}>
                  <Icons.Invoice size={isMobile ? 40 : 48} color={theme.textSecondary} />
                </div>
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "12px" }}>{searchTerm ? t.noResults : t.noInvoices}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL CRéATION -------------------------------------------------------- */}
      {modalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "10px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "16px", width: modalWidth, maxWidth: "95%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "18px" : "22px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.Invoice size={20} color={theme.primary} />
              {t.newInvoice}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.reference} *</label>
                <input type="text" placeholder="FACT-2024-001" value={modalForm.reference} onChange={e => setModalForm({ ...modalForm, reference: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} autoFocus />
              </div>
              <div>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.type} *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => setModalForm({ ...modalForm, type: "debit", clientId: "", supplierId: "", clientName: "", supplierName: "" })} style={{ flex: 1, padding: "8px", background: modalForm.type === "debit" ? "#ef4444" : theme.surfaceHover, border: `1px solid ${modalForm.type === "debit" ? "#ef4444" : theme.border}`, borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Icons.ArrowUpRight size={13} color="white" /> {t.debit}
                  </button>
                  <button type="button" onClick={() => setModalForm({ ...modalForm, type: "credit", clientId: "", supplierId: "", clientName: "", supplierName: "" })} style={{ flex: 1, padding: "8px", background: modalForm.type === "credit" ? theme.accent : theme.surfaceHover, border: `1px solid ${modalForm.type === "credit" ? theme.accent : theme.border}`, borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Icons.ArrowDownLeft size={13} color="white" /> {t.credit}
                  </button>
                </div>
              </div>
            </div>

            {modalForm.type === "debit" ? (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.client} *</label>
                <select value={modalForm.clientId} onChange={e => { const client = clients.find(c => c.id === parseInt(e.target.value)); setModalForm({ ...modalForm, clientId: e.target.value, clientName: client?.name || "", clientEmail: client?.email || "", clientAddress: client?.address || "", clientPhone: client?.phone || "", clientSiret: client?.siret || "" }); }} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px", marginBottom: "8px" }}>
                  <option value="">{t.selectLabel}</option>
                  {clients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px" }}>
                  <input type="text" placeholder="Nom du client" value={modalForm.clientName} onChange={e => setModalForm({ ...modalForm, clientName: e.target.value, clientId: "" })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="email" placeholder="Email" value={modalForm.clientEmail} onChange={e => setModalForm({ ...modalForm, clientEmail: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="tel" placeholder="Téléphone" value={modalForm.clientPhone} onChange={e => setModalForm({ ...modalForm, clientPhone: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="text" placeholder="Adresse" value={modalForm.clientAddress} onChange={e => setModalForm({ ...modalForm, clientAddress: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="text" placeholder="SIRET" value={modalForm.clientSiret} onChange={e => setModalForm({ ...modalForm, clientSiret: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.supplier} *</label>
                <select value={modalForm.supplierId} onChange={e => { const supplier = suppliers.find(s => s.id === parseInt(e.target.value)); setModalForm({ ...modalForm, supplierId: e.target.value, supplierName: supplier?.name || "" }); }} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }}>
                  <option value="">{t.selectLabel}</option>
                  {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
                </select>
                <input type="text" placeholder="Nom du fournisseur" value={modalForm.supplierName} onChange={e => setModalForm({ ...modalForm, supplierName: e.target.value, supplierId: "" })} style={{ width: "100%", marginTop: "8px", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "8px" }}>{t.lines}</label>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.surfaceHover, fontSize: "11px" }}>
                      <th style={{ padding: "8px", textAlign: "left", color: theme.text }}>{t.description}</th>
                      <th style={{ padding: "8px", textAlign: "center", width: "80px", color: theme.text }}>{t.qty}</th>
                      <th style={{ padding: "8px", textAlign: "right", width: "120px", color: theme.text }}>{t.unitPriceHT}</th>
                      <th style={{ padding: "8px", textAlign: "right", width: "120px", color: theme.text }}>{t.subtotalHT}</th>
                      <th style={{ padding: "8px", width: "40px", color: theme.text }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modalForm.items && modalForm.items.length > 0 ? modalForm.items : defaultFormState.items).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "6px" }}>
                          <input type="text" placeholder={t.description} value={item.description || ""} onChange={e => updateInvoiceItem(idx, "description", e.target.value, false)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px" }} />
                        </td>
                        <td style={{ padding: "6px" }}>
                          <input type="number" placeholder="1" value={item.quantity || 1} onChange={e => updateInvoiceItem(idx, "quantity", parseInt(e.target.value) || 0, false)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px", textAlign: "center" }} />
                        </td>
                        <td style={{ padding: "6px" }}>
                          <input type="number" step="0.01" placeholder="0.00" value={item.unitPriceHT || 0} onChange={e => updateInvoiceItem(idx, "unitPriceHT", parseFloat(e.target.value) || 0, false)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px", textAlign: "right" }} />
                        </td>
                        <td style={{ padding: "6px", textAlign: "right", color: theme.text, fontWeight: "500", fontSize: "12px" }}>
                          {formatCurrency(calculateItemTotalHT(item.quantity, item.unitPriceHT))}
                        </td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          <button onClick={() => removeInvoiceItem(idx, false)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "3px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icons.X size={10} color="white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addInvoiceItem(false)} style={{ marginTop: "8px", padding: "8px", background: `${theme.primary}20`, color: theme.primary, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <Icons.Plus size={13} color={theme.primary} /> {t.addLine}
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.description}</label>
              <textarea placeholder={t.description} rows={2} value={modalForm.description} onChange={e => setModalForm({ ...modalForm, description: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, resize: "vertical", fontSize: "12px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.tax} (%)</label>
                <input type="number" step="0.1" value={modalForm.taxRate} onChange={e => setModalForm({ ...modalForm, taxRate: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.dueDateLabel}</label>
                <input type="date" value={modalForm.dueDate} onChange={e => setModalForm({ ...modalForm, dueDate: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.paymentTerms}</label>
              <input type="text" placeholder="Net 30" value={modalForm.paymentTerms} onChange={e => setModalForm({ ...modalForm, paymentTerms: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.text, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.notes}</label>
              <textarea placeholder={t.notes} rows={2} value={modalForm.notes} onChange={e => setModalForm({ ...modalForm, notes: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, resize: "vertical", fontSize: "12px" }} />
            </div>

            <div style={{ marginBottom: "20px", padding: "12px", background: theme.surfaceHover, borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: theme.text }}>{t.totalHT}:</span>
                <span style={{ fontWeight: "bold", color: theme.text }}>{formatCurrency(getCreateSubtotalHT())}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: theme.text }}>{t.tax} ({modalForm.taxRate || 20}%):</span>
                <span style={{ color: theme.text }}>{formatCurrency(getCreateTaxAmount())}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", borderTop: `1px solid ${theme.border}`, paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ color: theme.text }}>{t.totalTTC}:</span>
                <span style={{ color: theme.accent }}>{formatCurrency(getCreateTotalTTC())}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={createInvoice} style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Icons.Save size={15} color="white" /> {t.create}
              </button>
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL éDITION --------------------------------------------------------- */}
      {editModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "10px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "16px", width: modalWidth, maxWidth: "95%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "18px" : "22px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.Edit size={20} color={theme.primary} />
              {t.editInvoice}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.reference} *</label>
                <input type="text" value={editModalForm.reference} onChange={e => setEditModalForm({ ...editModalForm, reference: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.type} *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => setEditModalForm({ ...editModalForm, type: "debit", clientId: "", supplierId: "", clientName: "", supplierName: "" })} style={{ flex: 1, padding: "8px", background: editModalForm.type === "debit" ? "#ef4444" : theme.surfaceHover, border: `1px solid ${editModalForm.type === "debit" ? "#ef4444" : theme.border}`, borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Icons.ArrowUpRight size={13} color="white" /> {t.debit}
                  </button>
                  <button type="button" onClick={() => setEditModalForm({ ...editModalForm, type: "credit", clientId: "", supplierId: "", clientName: "", supplierName: "" })} style={{ flex: 1, padding: "8px", background: editModalForm.type === "credit" ? theme.accent : theme.surfaceHover, border: `1px solid ${editModalForm.type === "credit" ? theme.accent : theme.border}`, borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Icons.ArrowDownLeft size={13} color="white" /> {t.credit}
                  </button>
                </div>
              </div>
            </div>

            {editModalForm.type === "debit" ? (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.client} *</label>
                <select value={editModalForm.clientId} onChange={e => { const client = clients.find(c => c.id === parseInt(e.target.value)); setEditModalForm({ ...editModalForm, clientId: e.target.value, clientName: client?.name || "", clientEmail: client?.email || "", clientAddress: client?.address || "", clientPhone: client?.phone || "", clientSiret: client?.siret || "" }); }} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px", marginBottom: "8px" }}>
                  <option value="">{t.selectLabel}</option>
                  {clients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px" }}>
                  <input type="text" placeholder="Nom du client" value={editModalForm.clientName} onChange={e => setEditModalForm({ ...editModalForm, clientName: e.target.value, clientId: "" })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="email" placeholder="Email" value={editModalForm.clientEmail} onChange={e => setEditModalForm({ ...editModalForm, clientEmail: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="tel" placeholder="Téléphone" value={editModalForm.clientPhone} onChange={e => setEditModalForm({ ...editModalForm, clientPhone: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="text" placeholder="Adresse" value={editModalForm.clientAddress} onChange={e => setEditModalForm({ ...editModalForm, clientAddress: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                  <input type="text" placeholder="SIRET" value={editModalForm.clientSiret} onChange={e => setEditModalForm({ ...editModalForm, clientSiret: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.supplier} *</label>
                <select value={editModalForm.supplierId} onChange={e => { const supplier = suppliers.find(s => s.id === parseInt(e.target.value)); setEditModalForm({ ...editModalForm, supplierId: e.target.value, supplierName: supplier?.name || "" }); }} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }}>
                  <option value="">{t.selectLabel}</option>
                  {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
                </select>
                <input type="text" placeholder="Nom du fournisseur" value={editModalForm.supplierName} onChange={e => setEditModalForm({ ...editModalForm, supplierName: e.target.value, supplierId: "" })} style={{ width: "100%", marginTop: "8px", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "12px" }} />
              </div>
            )}

            {/* ? CORRIGé : tableau des lignes du modal édition */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "8px" }}>{t.lines}</label>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.surfaceHover, fontSize: "11px" }}>
                      <th style={{ padding: "8px", textAlign: "left", color: theme.text }}>{t.description}</th>
                      <th style={{ padding: "8px", textAlign: "center", width: "80px", color: theme.text }}>{t.qty}</th>
                      <th style={{ padding: "8px", textAlign: "right", width: "120px", color: theme.text }}>{t.unitPriceHT}</th>
                      <th style={{ padding: "8px", textAlign: "right", width: "120px", color: theme.text }}>{t.subtotalHT}</th>
                      <th style={{ padding: "8px", width: "40px", color: theme.text }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editModalForm.items && editModalForm.items.length > 0 ? editModalForm.items : []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "6px" }}>
                          <input type="text" placeholder={t.description} value={item.description || ""} onChange={e => updateInvoiceItem(idx, "description", e.target.value, true)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px" }} />
                        </td>
                        <td style={{ padding: "6px" }}>
                          <input type="number" placeholder="1" value={item.quantity || 1} onChange={e => updateInvoiceItem(idx, "quantity", parseInt(e.target.value) || 0, true)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px", textAlign: "center" }} />
                        </td>
                        <td style={{ padding: "6px" }}>
                          <input type="number" step="0.01" placeholder="0.00" value={item.unitPriceHT || 0} onChange={e => updateInvoiceItem(idx, "unitPriceHT", parseFloat(e.target.value) || 0, true)} style={{ width: "100%", padding: "6px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px", color: theme.text, fontSize: "12px", textAlign: "right" }} />
                        </td>
                        <td style={{ padding: "6px", textAlign: "right", color: theme.text, fontWeight: "500", fontSize: "12px" }}>
                          {formatCurrency(calculateItemTotalHT(item.quantity, item.unitPriceHT))}
                        </td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          <button onClick={() => removeInvoiceItem(idx, true)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "3px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icons.X size={10} color="white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addInvoiceItem(true)} style={{ marginTop: "8px", padding: "8px", background: `${theme.primary}20`, color: theme.primary, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <Icons.Plus size={13} color={theme.primary} /> {t.addLine}
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.description}</label>
              <textarea rows={2} value={editModalForm.description} onChange={e => setEditModalForm({ ...editModalForm, description: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, resize: "vertical", fontSize: "12px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.tax} (%)</label>
                <input type="number" step="0.1" value={editModalForm.taxRate} onChange={e => setEditModalForm({ ...editModalForm, taxRate: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.dueDateLabel}</label>
                <input type="date" value={editModalForm.dueDate} onChange={e => setEditModalForm({ ...editModalForm, dueDate: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.paymentTerms}</label>
              <input type="text" placeholder="Net 30" value={editModalForm.paymentTerms} onChange={e => setEditModalForm({ ...editModalForm, paymentTerms: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.notes}</label>
              <textarea rows={2} value={editModalForm.notes} onChange={e => setEditModalForm({ ...editModalForm, notes: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, resize: "vertical", fontSize: "12px" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, fontSize: "11px", display: "block", marginBottom: "4px" }}>{t.status}</label>
              <select value={editModalForm.status} onChange={e => setEditModalForm({ ...editModalForm, status: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "13px" }}>
                <option value="pending">{t.pending}</option>
                <option value="paid">{t.paid}</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px", padding: "12px", background: theme.surfaceHover, borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: theme.text }}>{t.totalHT}:</span>
                <span style={{ fontWeight: "bold", color: theme.text }}>{formatCurrency(getEditSubtotalHT())}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: theme.text }}>{t.tax} ({editModalForm.taxRate || 20}%):</span>
                <span style={{ color: theme.text }}>{formatCurrency(getEditTaxAmount())}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", borderTop: `1px solid ${theme.border}`, paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ color: theme.text }}>{t.totalTTC}:</span>
                <span style={{ color: theme.accent }}>{formatCurrency(getEditTotalTTC())}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={updateInvoice} style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Icons.Save size={15} color="white" /> {t.save}
              </button>
              <button onClick={() => setEditModalOpen(false)} style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL APERçU AMéLIORé POUR MOBILE --- */}
      {showPreviewModal && viewInvoice && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "center",
            zIndex: 1001,
            padding: isMobile ? "0" : "20px",
            overflowY: "auto"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreviewModal(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: isMobile ? "0" : "16px",
              width: isMobile ? "100%" : "900px",
              maxWidth: "100%",
              maxHeight: isMobile ? "100vh" : "90vh",
              minHeight: isMobile ? "100vh" : "auto",
              overflowY: "auto",
              boxShadow: isMobile ? "none" : "0 25px 50px rgba(0,0,0,0.3)",
              paddingBottom: isMobile ? "20px" : "0"
            }}
          >
            {/* Barre d'outils mobile adaptée */}
            <div
              className="no-print"
              style={{
                position: isMobile ? "sticky" : "sticky",
                top: 0,
                background: "#1e293b",
                padding: isMobile ? "10px 12px" : "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: isMobile ? "6px" : "10px",
                borderBottom: "1px solid #334155",
                zIndex: 10,
                flexWrap: isMobile ? "wrap" : "nowrap"
              }}
            >
              <span style={{ color: "white", fontSize: isMobile ? "12px" : "14px", fontWeight: "500" }}>
                {viewInvoice.reference}
              </span>
              <div style={{ display: "flex", gap: isMobile ? "4px" : "10px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <button
                  onClick={() => generateInvoicePDF(viewInvoice)}
                  style={{
                    padding: isMobile ? "6px 10px" : "8px 16px",
                    background: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: isMobile ? "10px" : "13px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Icons.FileText size={isMobile ? 12 : 14} color="white" />
                  {isMobile ? "PDF" : t.pdf}
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: isMobile ? "6px 10px" : "8px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: isMobile ? "10px" : "13px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Icons.Printer size={isMobile ? 12 : 14} color="white" />
                  {isMobile ? "Imp" : t.print}
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    padding: isMobile ? "6px 10px" : "8px 16px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: isMobile ? "10px" : "13px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Icons.X size={isMobile ? 12 : 14} color="white" />
                  {isMobile ? "Fermer" : t.close}
                </button>
              </div>
            </div>

            {/* Contenu de la facture optimisé mobile */}
            <div
              id="invoice-print-area"
              style={{
                padding: isMobile ? "14px" : "30px",
                background: "white",
                fontFamily: "Arial, sans-serif",
                color: "#111",
                fontSize: isMobile ? "11px" : "13px"
              }}
            >
              {(() => {
                const subtotalHT = Number(viewInvoice.subtotalHT) || 0;
                const taxRate = Number(viewInvoice.taxRate) || 20;
                const taxAmount = Number(viewInvoice.taxAmount) || (subtotalHT * taxRate / 100);
                const totalTTC = Number(viewInvoice.amount) || (subtotalHT + taxAmount);
                const items = viewInvoice.items && viewInvoice.items.length > 0 ? viewInvoice.items : [];
                const clientInfo = viewInvoice.type === "debit" ? viewInvoice.clientName : viewInvoice.supplierName;
                const dateObj = new Date(viewInvoice.createdAt);
                const dueDateObj = viewInvoice.dueDate ? new Date(viewInvoice.dueDate) : null;
                const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";

                return (
                  <>
                    {/* En-tête compact mobile */}
                    <div style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      borderBottom: isMobile ? "2px solid #667eea" : "3px solid #667eea",
                      paddingBottom: isMobile ? "12px" : "20px",
                      marginBottom: isMobile ? "16px" : "30px",
                      gap: isMobile ? "8px" : "0"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "15px" }}>
                        <img
                          src="/images/logo.png"
                          alt="Logo"
                          style={{
                            width: isMobile ? "50px" : "150px",
                            height: isMobile ? "50px" : "150px",
                            objectFit: "contain"
                          }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <div>
                          <h1 style={{
                            color: "#667eea",
                            fontSize: isMobile ? "16px" : "26px",
                            margin: 0
                          }}>INOVEXA</h1>
                          <p style={{ color: "#333", fontSize: isMobile ? "9px" : "12px", margin: "2px 0 0" }}>ERP</p>
                        </div>
                      </div>
                      <div style={{ textAlign: isMobile ? "left" : "right" }}>
                        <h2 style={{
                          color: "#667eea",
                          fontSize: isMobile ? "18px" : "30px",
                          margin: 0
                        }}>{t.invoice}</h2>
                        <div style={{
                          background: viewInvoice.status === "paid" ? "#10b981" : viewInvoice.status === "pending" ? "#f59e0b" : "#ef4444",
                          color: "white",
                          padding: isMobile ? "2px 10px" : "4px 14px",
                          borderRadius: "20px",
                          fontSize: isMobile ? "9px" : "11px",
                          display: "inline-block",
                          marginTop: isMobile ? "4px" : "8px"
                        }}>
                          {viewInvoice.status === "paid" ? "PAYÉE" : viewInvoice.status === "pending" ? "EN ATTENTE" : "EN RETARD"}
                        </div>
                      </div>
                    </div>

                    {/* Grille d'info mobile: une colonne sur mobile */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: isMobile ? "12px" : "30px",
                      background: "#f5f5f5",
                      padding: isMobile ? "12px" : "20px",
                      borderRadius: isMobile ? "8px" : "10px",
                      marginBottom: isMobile ? "16px" : "30px"
                    }}>
                      <div>
                        <h4 style={{
                          color: "#667eea",
                          fontSize: isMobile ? "9px" : "11px",
                          marginBottom: isMobile ? "6px" : "10px",
                          textTransform: "uppercase",
                          letterSpacing: "1px"
                        }}>
                          {viewInvoice.type === "debit" ? t.client : t.supplier}
                        </h4>
                        <p style={{ margin: "4px 0", fontWeight: "bold", color: "#111", fontSize: isMobile ? "12px" : "13px" }}>{clientInfo || "-"}</p>
                        {viewInvoice.clientEmail && (
                          <p style={{ margin: "2px 0", fontSize: isMobile ? "10px" : "12px", color: "#111", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Icons.Mail size={isMobile ? 10 : 12} color="#667eea" /> {viewInvoice.clientEmail}
                          </p>
                        )}
                        {viewInvoice.clientPhone && (
                          <p style={{ margin: "2px 0", fontSize: isMobile ? "10px" : "12px", color: "#111", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Icons.Phone size={isMobile ? 10 : 12} color="#667eea" /> {viewInvoice.clientPhone}
                          </p>
                        )}
                        {viewInvoice.clientAddress && <p style={{ margin: "2px 0", fontSize: isMobile ? "10px" : "12px", color: "#111" }}>{viewInvoice.clientAddress}</p>}
                        {viewInvoice.clientSiret && <p style={{ margin: "2px 0", fontSize: isMobile ? "9px" : "11px", color: "#111" }}>SIRET: {viewInvoice.clientSiret}</p>}
                      </div>
                      <div>
                        <h4 style={{
                          color: "#667eea",
                          fontSize: isMobile ? "9px" : "11px",
                          marginBottom: isMobile ? "6px" : "10px",
                          textTransform: "uppercase",
                          letterSpacing: "1px"
                        }}>{t.details}</h4>
                        <p style={{ margin: "3px 0", fontSize: isMobile ? "11px" : "13px", color: "#111" }}>
                          <strong>{t.invoiceNumber}:</strong> {viewInvoice.reference}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: isMobile ? "11px" : "13px", color: "#111" }}>
                          <strong>{t.operationNumber}:</strong> {viewInvoice.operationNumber}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: isMobile ? "11px" : "13px", color: "#111" }}>
                          <strong>{t.dateLabel}:</strong> {dateObj.toLocaleDateString(locale)}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: isMobile ? "11px" : "13px", color: "#111" }}>
                          <strong>{t.dueDateLabel}:</strong> {dueDateObj ? dueDateObj.toLocaleDateString(locale) : "-"}
                        </p>
                        {viewInvoice.paymentTerms && (
                          <p style={{ margin: "3px 0", fontSize: isMobile ? "11px" : "13px", color: "#111" }}>
                            <strong>{t.paymentTerms}:</strong> {viewInvoice.paymentTerms}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tableau des articles adapté mobile */}
                    <h3 style={{
                      marginBottom: isMobile ? "10px" : "14px",
                      color: "#111",
                      fontSize: isMobile ? "13px" : "16px"
                    }}>{t.productsList}</h3>

                    <div style={{ overflowX: "auto", marginBottom: isMobile ? "16px" : "30px" }}>
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: isMobile ? "9px" : "12px"
                      }}>
                        <thead>
                          <tr style={{ background: "#667eea", color: "white" }}>
                            <th style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "left", color: "#000" }}>{t.description}</th>
                            <th style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", width: isMobile ? "40px" : "70px", color: "#000" }}>{t.qty}</th>
                            <th style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", width: isMobile ? "70px" : "120px", color: "#000" }}>{isMobile ? "PU HT" : t.unitPriceHT}</th>
                            <th style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", width: isMobile ? "70px" : "120px", color: "#000" }}>{isMobile ? "HT" : t.subtotalHT}</th>
                            <th style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", width: isMobile ? "70px" : "120px", color: "#000" }}>{isMobile ? "TTC" : t.subtotalTTC}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length > 0 ? items.map((item: any, i: number) => {
                            const itemHT = item.totalHT || ((item.quantity || 1) * (item.unitPriceHT || 0));
                            const itemTTC = item.totalTTC || (itemHT * (1 + taxRate / 100));
                            return (
                              <tr key={i} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                <td style={{ padding: isMobile ? "6px 8px" : "10px 12px", color: "#111", fontSize: isMobile ? "9px" : "12px" }}>
                                  {item.description || "-"}
                                </td>
                                <td style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", color: "#111", fontSize: isMobile ? "9px" : "12px" }}>
                                  {item.quantity || 1}
                                </td>
                                <td style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", color: "#111", fontSize: isMobile ? "9px" : "12px" }}>
                                  {formatCurrency(item.unitPriceHT || 0)}
                                </td>
                                <td style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", color: "#111", fontSize: isMobile ? "9px" : "12px" }}>
                                  {formatCurrency(itemHT)}
                                </td>
                                <td style={{ padding: isMobile ? "6px 8px" : "10px 12px", textAlign: "right", color: "#111", fontSize: isMobile ? "9px" : "12px" }}>
                                  {formatCurrency(itemTTC)}
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan={5} style={{ padding: isMobile ? "20px" : "40px", textAlign: "center", color: "#555" }}>Aucun article</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totaux adaptés mobile */}
                    <div style={{
                      width: isMobile ? "100%" : "320px",
                      marginLeft: isMobile ? "0" : "auto",
                      marginBottom: isMobile ? "16px" : "30px",
                      padding: isMobile ? "10px" : "0",
                      background: isMobile ? "#f8f8f8" : "transparent",
                      borderRadius: isMobile ? "8px" : "0"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: isMobile ? "4px 0" : "7px 0", color: "#111", fontSize: isMobile ? "11px" : "13px" }}>
                        <span>{t.totalHT}</span>
                        <span>{formatCurrency(subtotalHT)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: isMobile ? "4px 0" : "7px 0", color: "#111", fontSize: isMobile ? "11px" : "13px" }}>
                        <span>{t.tax} ({taxRate}%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: isMobile ? "8px 0" : "12px 0",
                        borderTop: "2px solid #667eea",
                        marginTop: isMobile ? "4px" : "8px",
                        fontWeight: "bold",
                        fontSize: isMobile ? "15px" : "18px",
                        color: "#111"
                      }}>
                        <span>{t.totalTTC}</span>
                        <span style={{ color: "#667eea" }}>{formatCurrency(totalTTC)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {viewInvoice.notes && (
                      <div style={{
                        background: "#f5f5f5",
                        padding: isMobile ? "10px" : "14px",
                        borderRadius: isMobile ? "6px" : "8px",
                        marginBottom: isMobile ? "12px" : "20px"
                      }}>
                        <strong style={{ color: "#111", fontSize: isMobile ? "10px" : "12px" }}>{t.notes}:</strong>
                        <p style={{ margin: "4px 0 0", color: "#111", fontSize: isMobile ? "10px" : "12px" }}>{viewInvoice.notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{
                      textAlign: "center",
                      marginTop: isMobile ? "16px" : "30px",
                      paddingTop: isMobile ? "12px" : "20px",
                      borderTop: "1px solid #ddd"
                    }}>
                      <p style={{ fontSize: isMobile ? "10px" : "12px", color: "#333" }}>{t.thankYou}</p>
                      <p style={{ fontSize: isMobile ? "9px" : "11px", color: "#555", marginTop: "4px" }}>INOVEXA ERP</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}