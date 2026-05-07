"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import JSZip from "jszip";
import { useResponsive } from "@/hooks/useResponsive";

interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ExportButtonsProps {
  data: any;
  filename?: string;
  onExport?: (format: string, success: boolean, count?: number) => void;
  maxRows?: number;
  enableColumnSelection?: boolean;
  selectedIds?: any[];
  selectedItems?: any[];
  idKey?: string;
  templates?: any[];
  onSaveTemplate?: (template: any) => void;
  companyLogo?: string;
  customExportData?: {
    activeTab?: string;
    exportData?: any;
    currentData?: any[];
    getCurrentDisplayData?: () => any[];
  };
}

export default function ExportButtons({ 
  data, 
  filename = "export", 
  onExport,
  maxRows = 100000,
  enableColumnSelection = true,
  selectedIds = [],
  selectedItems = [],
  idKey = "id",
  templates = [],
  onSaveTemplate,
  companyLogo = "/logo.png",
  customExportData
}: ExportButtonsProps) {
  const { t, language } = useLanguage();
  const { isMobile } = useResponsive(); 
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>([]);
  const [delimiter, setDelimiter] = useState(",");
  const [encoding, setEncoding] = useState<"UTF-8" | "ISO-8859-1">("UTF-8");
  const [dateFormat, setDateFormat] = useState<"locale" | "iso" | "fr" | "us">("locale");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [exportMode, setExportMode] = useState<"all" | "selected">("all");
  const [progress, setProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const isMounted = useRef(true);

  // Fonction de traduction avec fallback
  const getTranslatedText = (fr: string, en: string, es: string): string => {
    if (language === 'fr') return fr;
    if (language === 'es') return es;
    return en;
  };

  const EXCLUDED_COLUMNS = ['id', 'userId', 'password', 'token', '__v'];

  const formatColumnLabel = useCallback((key: string): string => {
    const labels: Record<string, string> = {
      clientName: getTranslatedText("CLIENT", "CLIENT", "CLIENTE"),
      supplierName: getTranslatedText("FOURNISSEUR", "SUPPLIER", "PROVEEDOR"),
      amount: getTranslatedText("MONTANT", "AMOUNT", "MONTO"),
      status: getTranslatedText("STATUT", "STATUS", "ESTADO"),
      dueDate: getTranslatedText("ÉCHÉANCE", "DUE DATE", "VENCIMIENTO"),
      name: getTranslatedText("NOM", "NAME", "NOMBRE"),
      email: getTranslatedText("EMAIL", "EMAIL", "CORREO"),
      phone: getTranslatedText("TÉLÉPHONE", "PHONE", "TELÉFONO"),
      address: getTranslatedText("ADRESSE", "ADDRESS", "DIRECCIÓN"),
      quantity: getTranslatedText("QUANTITÉ", "QUANTITY", "CANTIDAD"),
      price: getTranslatedText("PRIX", "PRICE", "PRECIO"),
      total: getTranslatedText("TOTAL", "TOTAL", "TOTAL"),
      productName: getTranslatedText("PRODUIT", "PRODUCT", "PRODUCTO"),
      category: getTranslatedText("CATÉGORIE", "CATEGORY", "CATEGORÍA"),
      trackingNumber: getTranslatedText("N° SUIVI", "TRACKING", "SEGUIMIENTO"),
      reference: getTranslatedText("RÉFÉRENCE", "REFERENCE", "REFERENCIA"),
      month: getTranslatedText("MOIS", "MONTH", "MES"),
      revenue: getTranslatedText("CA", "REVENUE", "INGRESOS"),
      expenses: getTranslatedText("DÉPENSES", "EXPENSES", "GASTOS"),
      profit: getTranslatedText("BÉNÉFICE", "PROFIT", "BENEFICIO"),
      description: getTranslatedText("DESCRIPTION", "DESCRIPTION", "DESCRIPCIÓN"),
      vendor: getTranslatedText("FOURNISSEUR", "VENDOR", "PROVEEDOR"),
      inflow: getTranslatedText("ENTRÉES", "INFLOW", "ENTRADAS"),
      outflow: getTranslatedText("SORTIES", "OUTFLOW", "SALIDAS"),
      net: getTranslatedText("FLUX NET", "NET FLOW", "FLUJO NETO"),
      budget: getTranslatedText("BUDGET", "BUDGET", "PRESUPUESTO"),
      actual: getTranslatedText("RÉEL", "ACTUAL", "REAL"),
      variance: getTranslatedText("ÉCART", "VARIANCE", "VARIANZA"),
      label: getTranslatedText("LIBELLÉ", "LABEL", "ETIQUETA"),
      value: getTranslatedText("VALEUR", "VALUE", "VALOR"),
      category: getTranslatedText("CATÉGORIE", "CATEGORY", "CATEGORÍA"),
      items: getTranslatedText("ÉLÉMENTS", "ITEMS", "ELEMENTOS"),
      month: getTranslatedText("MOIS", "MONTH", "MES"),
      target: getTranslatedText("CIBLE", "TARGET", "OBJETIVO"),
      description: getTranslatedText("DESCRIPTION", "DESCRIPTION", "DESCRIPCIÓN")
    };
    return (labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')).toUpperCase();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    setMounted(true);
    return () => {
      isMounted.current = false;
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const u = JSON.parse(userData);
        setUser(u);
        if (u.profileImage) {
          const imageUrl = u.profileImage.startsWith('http') ? u.profileImage : `http://localhost:3001${u.profileImage}`;
          setProfileImage(imageUrl);
        }
      } catch (e) { console.error("Erreur chargement user:", e); }
    }
  }, []);

  // Obtenir les données à exporter en fonction de l'onglet actif et du mode d'export
  const getExportData = useCallback(() => {
    // Si des données personnalisées sont fournies via customExportData
    if (customExportData) {
      // Si on a des données d'export spécifiques pour l'onglet
      if (customExportData.exportData) {
        const exportData = customExportData.exportData;
        return Array.isArray(exportData) ? exportData : [exportData];
      }
      // Si on a des données actuelles via la fonction getCurrentDisplayData
      if (customExportData.getCurrentDisplayData) {
        const displayData = customExportData.getCurrentDisplayData();
        if (displayData && Array.isArray(displayData)) {
          return displayData;
        }
      }
      // Si on a des données actuelles via currentData
      if (customExportData.currentData && Array.isArray(customExportData.currentData)) {
        return customExportData.currentData;
      }
    }

    // Sinon, utiliser les données par défaut
    if (!data) return [];
    const sourceData = Array.isArray(data) ? data : [data];
    
    if (exportMode === "selected") {
      if (selectedItems.length > 0) {
        return [...selectedItems].slice(0, maxRows);
      } else if (selectedIds.length > 0) {
        return sourceData.filter(item => selectedIds.includes(item[idKey])).slice(0, maxRows);
      }
      return [];
    }
    return sourceData.slice(0, maxRows);
  }, [data, exportMode, selectedIds, selectedItems, idKey, maxRows, customExportData]);

  const dataArray = useMemo(() => getExportData(), [getExportData]);

  // Fonction pour aplatir les objets imbriqués (pour Bilan comptable)
  const flattenObject = useCallback((obj: any, prefix = ''): any => {
    if (obj === null || obj === undefined) return {};
    if (typeof obj !== 'object') return { [prefix]: obj };
    
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (Array.isArray(obj[key])) {
          // Pour les tableaux, les convertir en chaîne
          result[newKey] = JSON.stringify(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(result, flattenObject(obj[key], newKey));
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  }, []);

  // Normaliser les données pour l'exportation
  const normalizeData = useCallback((inputData: any[]): any[] => {
    if (!inputData || inputData.length === 0) return [];
    
    return inputData.map(item => {
      // Si l'élément a une structure avec category/items (Bilan comptable)
      if (item.category && item.items && Array.isArray(item.items)) {
        const flatItem: any = {};
        item.items.forEach((subItem: any) => {
          if (subItem.label && subItem.value !== undefined) {
            flatItem[subItem.label] = subItem.value;
          }
        });
        flatItem['_categorie'] = item.category;
        return flatItem;
      }
      // Si l'élément a une structure avec month/inflow/outflow/net (Trésorerie)
      if (item.month && (item.inflow !== undefined || item.outflow !== undefined)) {
        return {
          month: item.month,
          inflow: item.inflow,
          outflow: item.outflow,
          net: item.net
        };
      }
      // Si c'est un tableau de valeurs simples (Ratios)
      if (item.name && item.value !== undefined) {
        return {
          name: item.name,
          value: item.value,
          target: item.target,
          status: item.status,
          description: item.description
        };
      }
      // Sinon, normaliser l'objet normal
      return flattenObject(item);
    });
  }, [flattenObject]);

  const normalizedDataArray = useMemo(() => normalizeData(dataArray), [dataArray, normalizeData]);

  const availableColumns = useMemo(() => {
    if (normalizedDataArray.length === 0 || !normalizedDataArray[0] || typeof normalizedDataArray[0] !== 'object') {
      return [];
    }
    return Object.keys(normalizedDataArray[0]).map(key => ({
      key,
      label: formatColumnLabel(key),
      selected: !EXCLUDED_COLUMNS.includes(key)
    }));
  }, [normalizedDataArray, formatColumnLabel]);

  useEffect(() => {
    if (availableColumns.length > 0 && !initialized && isMounted.current) {
      setSelectedColumns(availableColumns);
      setInitialized(true);
    }
  }, [availableColumns, initialized]);

  const formatDateValue = useCallback((value: any): string => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    
    switch (dateFormat) {
      case "iso": return date.toISOString().split('T')[0];
      case "fr": return date.toLocaleDateString("fr-FR");
      case "us": return date.toLocaleDateString("en-US");
      default: return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    }
  }, [dateFormat, language]);

  const isValidData = useCallback((): boolean => {
    return normalizedDataArray && normalizedDataArray.length > 0;
  }, [normalizedDataArray]);

  const getDataArray = useCallback((): any[] => {
    return normalizedDataArray;
  }, [normalizedDataArray]);

  const cleanData = useCallback((dataArrayToClean: any[]): any[] => {
    const selectedKeys = selectedColumns.filter(col => col.selected).map(col => col.key);
    if (selectedKeys.length === 0) return dataArrayToClean;
    
    return dataArrayToClean.map(row => {
      const newRow: any = {};
      selectedKeys.forEach(key => {
        if (row[key] !== undefined) newRow[key] = row[key];
      });
      return newRow;
    });
  }, [selectedColumns]);

  const formatCurrencyValue = useCallback((value: any): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
  }, [language]);

  const formatValue = useCallback((value: any, key: string): string => {
    if (value === undefined || value === null) return "";
    
    // Nettoyer le symbole de devise s'il est présent
    let cleanValue = value;
    if (typeof value === 'string') {
      cleanValue = value.replace(/[€$£DT]/g, '').trim();
    }
    
    if (key.toLowerCase().includes("date") || key.toLowerCase().includes("created") || 
        key.toLowerCase().includes("updated") || key.toLowerCase().includes("due")) {
      return formatDateValue(cleanValue);
    }
    
    if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("total") || 
        key.toLowerCase().includes("price") || key.toLowerCase().includes("revenue") ||
        key.toLowerCase().includes("expenses") || key.toLowerCase().includes("profit") ||
        key.toLowerCase().includes("inflow") || key.toLowerCase().includes("outflow") ||
        key.toLowerCase().includes("net") || key.toLowerCase().includes("budget") ||
        key.toLowerCase().includes("actual") || key.toLowerCase().includes("variance") ||
        key.toLowerCase().includes("value") || key.toLowerCase().includes("balance")) {
      const num = typeof cleanValue === 'string' ? parseFloat(cleanValue) : Number(cleanValue);
      if (isNaN(num)) return String(value);
      return formatCurrencyValue(num);
    }
    
    if (typeof value === "boolean") return getTranslatedText("OUI", "YES", "SÍ");
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "number") return value.toLocaleString();
    
    if (typeof value === "string") {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
    }
    
    return String(value);
  }, [formatDateValue, formatCurrencyValue]);

  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const showError = useCallback((message?: string) => {
    showToast('error', message || getTranslatedText("Aucune donnée à exporter", "No data to export", "No hay datos para exportar"));
  }, [showToast]);

  const showSuccess = useCallback((format: string, count: number) => {
    const successMsg = getTranslatedText(
      `${format.toUpperCase()} exporté avec succès ! ${count} ligne(s).`,
      `${format.toUpperCase()} exported successfully! ${count} row(s).`,
      `${format.toUpperCase()} exportado con éxito! ${count} fila(s).`
    );
    showToast('success', successMsg);
    if (onExport) onExport(format, true, count);
  }, [showToast, onExport]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMounted.current) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          settingsRef.current && !settingsRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowSettings(false);
        setActiveFormat(null);
      }
    };
    
    if ((showMenu || showSettings) && mounted) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu, showSettings, mounted]);

  useEffect(() => {
    if ((showMenu || showSettings) && buttonRef.current && mounted) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [showMenu, showSettings, mounted]);

  const getHeaderWithProfileHTML = useCallback(() => {
    const companyName = getTranslatedText("INOVEXA ERP", "INOVEXA ERP", "INOVEXA ERP");
    const profileAlt = getTranslatedText("Profil", "Profile", "Perfil");
    
    return `
      <div style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="width: 80px;">
            ${profileImage ? 
              `<img src="${profileImage}" alt="${profileAlt}" style="width: 60px; height: 60px; border-radius: 30px; object-fit: cover; border: 2px solid #667eea;">` : 
              '<div style="width:60px;height:60px;border-radius:30px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;border:2px solid #667eea;">U</div>'}
          </div>
          <div style="text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 3px;">${companyName}</div>
            <div style="font-size: 18px; font-weight: bold; color: white; margin-top: 5px;">${filename.toUpperCase()}</div>
          </div>
          <div style="width: 80px;"></div>
        </div>
      </div>
    `;
  }, [profileImage, filename]);

  const escapeHtml = useCallback((text: string): string => {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
  }, []);

  const exportToCSV = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const csvRows: string[] = [];
      
      if (includeHeaders) {
        csvRows.push(headers.map(h => `"${formatColumnLabel(h)}"`).join(delimiter));
      }
      
      for (const row of cleanedData) {
        const values = headers.map(header => `"${formatValue(row[header], header)}"`);
        csvRows.push(values.join(delimiter));
        if (isMounted.current) {
          setProgress(prev => Math.min(prev + 100 / cleanedData.length, 99));
        }
      }
      
      if (isMounted.current) setProgress(100);
      const csvContent = csvRows.join("\n");
      const bom = encoding === "UTF-8" ? "\uFEFF" : "";
      const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tabName = customExportData?.activeTab || "export";
      a.download = `${filename}_${tabName}_${new Date().toISOString().slice(0,19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("CSV", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export CSV:", error);
      showError(getTranslatedText("Erreur lors de l'export CSV", "Error exporting CSV", "Error al exportar CSV"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, includeHeaders, delimiter, formatColumnLabel, formatValue, encoding, showSuccess, customExportData]);

  const exportToJSON = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      
      const exportData = {
        metadata: {
          document: filename.toUpperCase(),
          generatedBy: "INOVEXA ERP",
          generatedOn: new Date().toISOString(),
          exportMode: exportMode,
          totalRecords: cleanedData.length,
          user: user?.name,
          userEmail: user?.email,
          profileImage: profileImage,
          activeTab: customExportData?.activeTab || "general"
        },
        data: cleanedData
      };
      
      if (isMounted.current) setProgress(100);
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tabName = customExportData?.activeTab || "export";
      a.download = `${filename}_${tabName}_${new Date().toISOString().slice(0,19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("JSON", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export JSON:", error);
      showError(getTranslatedText("Erreur lors de l'export JSON", "Error exporting JSON", "Error al exportar JSON"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, exportMode, user, profileImage, customExportData, showSuccess]);

  const exportToExcel = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const headerLabels = headers.map(h => formatColumnLabel(h));
      const companyName = getTranslatedText("INOVEXA ERP", "INOVEXA ERP", "INOVEXA ERP");
      const generatedBy = getTranslatedText("DOCUMENT GÉNÉRÉ PAR", "DOCUMENT GENERATED BY", "DOCUMENTO GENERADO POR");
      const generatedOn = getTranslatedText("Généré le", "Generated on", "Generado el");
      const tabName = customExportData?.activeTab || "export";
      
      let html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}_${tabName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 12px; }
          .title { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 3px; }
          .subtitle { font-size: 14px; font-weight: bold; color: white; margin-top: 5px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f2f2f2; color: #000000; padding: 10px; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${companyName}</div>
          <div class="subtitle">${filename.toUpperCase()} - ${tabName.toUpperCase()}</div>
        </div>
        <table border="1">
          <thead>
            <tr>
              ${headerLabels.map(h => `<th style="color: #000000; background-color: #f2f2f2;">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>`;
      
      for (const row of cleanedData) {
        html += `<tr>`;
        for (const header of headers) {
          let val = formatValue(row[header], header);
          html += `<td>${escapeHtml(String(val)).substring(0, 500)}<\/td>`;
        }
        html += `<\/tr>`;
        if (isMounted.current) {
          setProgress(prev => Math.min(prev + 100 / cleanedData.length, 99));
        }
      }
      
      if (isMounted.current) setProgress(100);
      html += `
          </tbody>
        <\/table>
        <div class="footer">
          <p>${generatedBy} INOVEXA ERP - ${new Date().getFullYear()} | ${generatedOn} ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>`;
      
      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${tabName}_${new Date().toISOString().slice(0,19)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("Excel", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export Excel:", error);
      showError(getTranslatedText("Erreur lors de l'export Excel", "Error exporting Excel", "Error al exportar Excel"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, formatColumnLabel, formatValue, escapeHtml, showSuccess, customExportData]);

  const exportToPDF = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const headerLabels = headers.map(h => formatColumnLabel(h));
      const printWindow = window.open("", "_blank");
      const companyName = getTranslatedText("INOVEXA ERP", "INOVEXA ERP", "INOVEXA ERP");
      const generatedBy = getTranslatedText("DOCUMENT GÉNÉRÉ PAR", "DOCUMENT GENERATED BY", "DOCUMENTO GENERADO POR");
      const tabName = customExportData?.activeTab || "export";
      
      let html = `<!DOCTYPE html>
      <html>
      <head>
        <title>${filename}_${tabName}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f2f2f2; color: #000000; padding: 10px; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        ${getHeaderWithProfileHTML()}
        <table border="1">
          <thead>
            <tr>
              ${headerLabels.map(h => `<th style="color: #000000; background-color: #f2f2f2;">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>`;
      
      for (const row of cleanedData.slice(0, 1000)) {
        html += `<tr>`;
        for (const header of headers) {
          let val = formatValue(row[header], header);
          html += `<td>${escapeHtml(String(val)).substring(0, 100)}<\/td>`;
        }
        html += `<\/tr>`;
        if (isMounted.current) {
          setProgress(prev => Math.min(prev + 100 / Math.min(cleanedData.length, 1000), 99));
        }
      }
      
      if (isMounted.current) setProgress(100);
      html += `
          </tbody>
        <\/table>
        <div class="footer">
          <p>${generatedBy} INOVEXA ERP - ${new Date().getFullYear()}</p>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 1000);
            }, 500);
          };
        <\/script>
      </body>
      </html>`;
      
      printWindow?.document.write(html);
      printWindow?.document.close();
      
      showSuccess("PDF", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export PDF:", error);
      showError(getTranslatedText("Erreur lors de l'export PDF", "Error exporting PDF", "Error al exportar PDF"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, formatColumnLabel, formatValue, getHeaderWithProfileHTML, escapeHtml, showSuccess, customExportData]);

  const exportToTXT = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const headerLabels = headers.map(h => formatColumnLabel(h));
      const companyName = getTranslatedText("INOVEXA ERP", "INOVEXA ERP", "INOVEXA ERP");
      const generatedBy = getTranslatedText("DOCUMENT GÉNÉRÉ PAR", "DOCUMENT GENERATED BY", "DOCUMENTO GENERADO POR");
      const tabName = customExportData?.activeTab || "export";
      const borderLine = "═".repeat(80);
      
      let txtContent = `╔══════════════════════════════════════════════════════════════════════════════╗\n`;
      txtContent += `║                              ${companyName}                                    ║\n`;
      txtContent += `╚══════════════════════════════════════════════════════════════════════════════╝\n\n`;
      txtContent += `📄 ${filename.toUpperCase()} - ${tabName.toUpperCase()}\n`;
      txtContent += `${borderLine}\n\n`;
      
      if (includeHeaders) {
        txtContent += headerLabels.join(" | ") + "\n";
        txtContent += "─".repeat(80) + "\n";
      }
      
      for (const row of cleanedData) {
        const values = headers.map(header => formatValue(row[header], header));
        txtContent += values.join(" | ") + "\n";
        if (isMounted.current) {
          setProgress(prev => Math.min(prev + 100 / cleanedData.length, 99));
        }
      }
      
      if (isMounted.current) setProgress(100);
      txtContent += `\n${borderLine}\n`;
      txtContent += `📄 ${generatedBy} ${companyName} - ${new Date().getFullYear()}\n`;
      
      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${tabName}_${new Date().toISOString().slice(0,19)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("TXT", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export TXT:", error);
      showError(getTranslatedText("Erreur lors de l'export TXT", "Error exporting TXT", "Error al exportar TXT"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, formatColumnLabel, formatValue, includeHeaders, showSuccess, customExportData]);

  const exportToZIP = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const zip = new JSZip();
      const tabName = customExportData?.activeTab || "export";
      
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const headerLabels = headers.map(h => formatColumnLabel(h));
      const companyName = getTranslatedText("INOVEXA ERP", "INOVEXA ERP", "INOVEXA ERP");
      
      // CSV
      let csvContent = `${companyName}\n${filename.toUpperCase()} - ${tabName.toUpperCase()}\n\n`;
      if (includeHeaders) {
        csvContent += headerLabels.join(",") + "\n";
      }
      for (const row of cleanedData) {
        const values = headers.map(header => formatValue(row[header], header));
        csvContent += values.join(",") + "\n";
      }
      zip.file(`${filename}_${tabName}.csv`, csvContent);
      
      // JSON
      const jsonData = {
        metadata: {
          document: filename.toUpperCase(),
          tab: tabName,
          generatedBy: companyName,
          generatedOn: new Date().toISOString(),
          exportMode: exportMode,
          totalRecords: cleanedData.length,
          user: user?.name,
          userEmail: user?.email,
          profileImage: profileImage,
          activeTab: tabName
        },
        data: cleanedData
      };
      zip.file(`${filename}_${tabName}.json`, JSON.stringify(jsonData, null, 2));
      
      // TXT
      let txtContent = `╔══════════════════════════════════════════════════════════════════════════════╗\n`;
      txtContent += `║                              ${companyName}                                    ║\n`;
      txtContent += `╚══════════════════════════════════════════════════════════════════════════════╝\n\n`;
      txtContent += `📄 ${filename.toUpperCase()} - ${tabName.toUpperCase()}\n\n`;
      if (includeHeaders) {
        txtContent += headerLabels.join(" | ") + "\n";
        txtContent += "-".repeat(80) + "\n";
      }
      for (const row of cleanedData.slice(0, 1000)) {
        const values = headers.map(header => formatValue(row[header], header));
        txtContent += values.join(" | ") + "\n";
      }
      zip.file(`${filename}_${tabName}.txt`, txtContent);
      
      const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
        if (isMounted.current) {
          setProgress(metadata.percent);
        }
      });
      
      if (isMounted.current) setProgress(100);
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${tabName}_${new Date().toISOString().slice(0,19)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("ZIP", dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur export ZIP:", error);
      showError(getTranslatedText("Erreur lors de l'export ZIP", "Error exporting ZIP", "Error al exportar ZIP"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, formatColumnLabel, formatValue, includeHeaders, exportMode, user, profileImage, customExportData, showSuccess]);

  const print = useCallback(async () => {
    let dataArrayLocal = getDataArray();
    if (!isValidData() || dataArrayLocal.length === 0) {
      showError();
      return;
    }
    
    if (!isMounted.current) return;
    setIsExporting(true);
    setProgress(0);
    
    try {
      const cleanedData = cleanData(dataArrayLocal);
      const firstItem = cleanedData[0];
      if (!firstItem || typeof firstItem !== 'object') {
        showError();
        return;
      }
      
      const headers = Object.keys(firstItem);
      const headerLabels = headers.map(h => formatColumnLabel(h));
      const printWindow = window.open("", "_blank");
      const tabName = customExportData?.activeTab || "export";
      
      let html = `<!DOCTYPE html>
      <html>
      <head>
        <title>${filename}_${tabName}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f2f2f2; color: #000000; padding: 10px; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        ${getHeaderWithProfileHTML()}
        <table border="1">
          <thead>
            <tr>
              ${headerLabels.map(h => `<th style="color: #000000; background-color: #f2f2f2;">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>`;
      
      for (const row of cleanedData.slice(0, 500)) {
        html += `<tr>`;
        for (const header of headers) {
          let val = formatValue(row[header], header);
          html += `<td>${escapeHtml(String(val)).substring(0, 100)}<\/td>`;
        }
        html += `<\/tr>`;
      }
      
      html += `
          </tbody>
        <\/table>
        <div class="footer">
          <p>${getTranslatedText("DOCUMENT GÉNÉRÉ PAR", "DOCUMENT GENERATED BY", "DOCUMENTO GENERADO POR")} INOVEXA ERP - ${new Date().getFullYear()}</p>
        </div>
        <script>
          window.onload = function() { window.print(); };
        <\/script>
      </body>
      </html>`;
      
      printWindow?.document.write(html);
      printWindow?.document.close();
      
      showSuccess(getTranslatedText("Impression", "Print", "Impresión"), dataArrayLocal.length);
    } catch (error) {
      console.error("Erreur impression:", error);
      showError(getTranslatedText("Erreur lors de l'impression", "Print error", "Error al imprimir"));
    } finally {
      if (isMounted.current) {
        setIsExporting(false);
        setProgress(0);
      }
    }
  }, [getDataArray, isValidData, showError, cleanData, filename, formatColumnLabel, formatValue, getHeaderWithProfileHTML, escapeHtml, showSuccess, customExportData]);

  const handleExport = useCallback(async (format: string, exportFn: () => Promise<void>) => {
    setActiveFormat(format);
    await exportFn();
    setActiveFormat(null);
    setShowMenu(false);
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setSelectedColumns(prev => prev.map(col => 
      col.key === key ? { ...col, selected: !col.selected } : col
    ));
  }, []);

  const selectAllColumns = useCallback(() => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: true })));
  }, []);

  const selectNoneColumns = useCallback(() => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: false })));
  }, []);

  const getInitials = useCallback((name: string): string => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  }, []);

  const ExportIconCSV = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/>
    </svg>
  );
  const ExportIconExcel = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
      <path d="M13 12l2 3m0-3l-2 3"/>
    </svg>
  );
  const ExportIconJSON = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7c0-1.1.9-2 2-2h1a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2"/>
      <path d="M14 5v4a2 2 0 002 2h2"/><path d="M14 19v-4a2 2 0 012-2h2"/>
    </svg>
  );
  const ExportIconPDF = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <path d="M9 15v-4h2a2 2 0 010 4H9zm5-4h1.5a1.5 1.5 0 010 3H14v1"/>
    </svg>
  );
  const ExportIconTXT = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  );
  const ExportIconZIP = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/><path d="M9 6h6M9 9h6"/>
    </svg>
  );
  const ExportIconPrint = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/><line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  );

  const exportOptions = [
    { format: "csv",   label: getTranslatedText("CSV", "CSV", "CSV"),                         icon: <ExportIconCSV />,   color: "#10b981", action: exportToCSV,   desc: getTranslatedText("Tableur universel", "Universal spreadsheet", "Hoja de cálculo universal") },
    { format: "excel", label: getTranslatedText("Excel", "Excel", "Excel"),                   icon: <ExportIconExcel />, color: "#10b981", action: exportToExcel, desc: getTranslatedText("Microsoft Excel", "Microsoft Excel", "Microsoft Excel") },
    { format: "json",  label: getTranslatedText("JSON", "JSON", "JSON"),                       icon: <ExportIconJSON />,  color: "#3b82f6", action: exportToJSON,  desc: getTranslatedText("Format structuré", "Structured format", "Formato estructurado") },
    { format: "pdf",   label: getTranslatedText("PDF", "PDF", "PDF"),                         icon: <ExportIconPDF />,   color: "#ef4444", action: exportToPDF,   desc: getTranslatedText("Document PDF", "PDF document", "Documento PDF") },
    { format: "txt",   label: getTranslatedText("TXT", "TXT", "TXT"),                         icon: <ExportIconTXT />,   color: "#8b5cf6", action: exportToTXT,   desc: getTranslatedText("Texte brut", "Plain text", "Texto plano") },
    { format: "zip",   label: getTranslatedText("ZIP", "ZIP", "ZIP"),                         icon: <ExportIconZIP />,   color: "#f59e0b", action: exportToZIP,   desc: getTranslatedText("Archive multi-format", "Multi-format archive", "Archivo multi-formato") },
    { format: "print", label: getTranslatedText("Imprimer", "Print", "Imprimir"),             icon: <ExportIconPrint />, color: "#f59e0b", action: print,         desc: getTranslatedText("Impression directe", "Direct print", "Impresión directa") }
  ];

  const dataCount = normalizedDataArray.length;
  const selectedDisplayCount = selectedItems.length > 0 ? selectedItems.length : selectedIds.length;

  if (!isValidData()) {
    return (
      <button
        disabled
        style={{
          padding: "10px 20px",
          background: "#555",
          color: "#999",
          border: "1px solid #444",
          borderRadius: "8px",
          cursor: "not-allowed",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px"
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {getTranslatedText("Exporter", "Export", "Exportar")}
      </button>
    );
  }

  const allDataText = getTranslatedText("Toutes les données", "All data", "Todos los datos");
  const selectedOnlyText = getTranslatedText("Sélection uniquement", "Selected only", "Solo selección");
  const recordsText = getTranslatedText("enregistrement(s)", "record(s)", "registro(s)");
  const customizeText = getTranslatedText("Personnaliser", "Customize", "Personalizar");
  const closeText = getTranslatedText("Fermer", "Close", "Cerrar");
  const exportModeText = getTranslatedText("Mode d'export", "Export mode", "Modo de exportación");
  const columnsToExportText = getTranslatedText("Colonnes à exporter", "Columns to export", "Columnas a exportar");
  const selectAllText = getTranslatedText("Tout", "All", "Todo");
  const selectNoneText = getTranslatedText("Aucune", "None", "Ninguna");
  const columnsSelectedText = getTranslatedText("colonne(s) sélectionnée(s)", "column(s) selected", "columna(s) seleccionada(s)");
  const dateFormatText = getTranslatedText("Format des dates", "Date format", "Formato de fechas");
  const localeDateText = getTranslatedText("Local (JJ/MM/AAAA)", "Local (DD/MM/YYYY)", "Local (DD/MM/AAAA)");
  const isoDateText = getTranslatedText("ISO (YYYY-MM-DD)", "ISO (YYYY-MM-DD)", "ISO (AAAA-MM-DD)");
  const frenchDateText = getTranslatedText("Français (JJ/MM/AAAA)", "French (DD/MM/YYYY)", "Francés (DD/MM/AAAA)");
  const usDateText = getTranslatedText("Anglais (MM/JJ/AAAA)", "English (MM/DD/YYYY)", "Inglés (MM/DD/AAAA)");
  const csvSeparatorText = getTranslatedText("Séparateur CSV", "CSV separator", "Separador CSV");
  const commaText = getTranslatedText("Virgule (,)", "Comma (,)", "Coma (,)");
  const semicolonText = getTranslatedText("Point-virgule (;)", "Semicolon (;)", "Punto y coma (;)");
  const tabText = getTranslatedText("Tabulation", "Tab", "Tabulación");
  const pipeText = getTranslatedText("Pipe (|)", "Pipe (|)", "Pipe (|)");
  const encodingText = getTranslatedText("Encodage", "Encoding", "Codificación");
  const encodingRecommendedText = getTranslatedText("UTF-8 (recommandé)", "UTF-8 (recommended)", "UTF-8 (recomendado)");
  const encodingLatinText = getTranslatedText("ISO-8859-1 (Latin-1)", "ISO-8859-1 (Latin-1)", "ISO-8859-1 (Latín-1)");
  const includeHeadersText = getTranslatedText("Inclure les en-têtes", "Include headers", "Incluir encabezados");
  const maxRowsLimitText = getTranslatedText("Limite maximale", "Maximum limit", "Límite máximo");

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 10001,
            animation: "slideInRight 0.3s ease, fadeOut 0.3s ease 4.7s forwards"
          }}
        >
          <div style={{
            padding: "12px 20px",
            borderRadius: "8px",
            background: toast.type === 'success' ? "#10b981" : toast.type === 'error' ? "#ef4444" : toast.type === 'warning' ? "#f59e0b" : "#667eea",
            color: "white",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            {toast.type === 'success' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            {toast.type === 'error' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
            {toast.type === 'warning' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            {toast.type === 'info' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
            {toast.message}
          </div>
        </div>
      ))}

      {isExporting && progress > 0 && progress < 100 && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            background: "#1a1a1a",
            border: "1px solid #667eea",
            borderRadius: "12px",
            padding: "12px 20px",
            zIndex: 10001,
            minWidth: "280px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            animation: "fadeInUp 0.3s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "white", fontSize: "13px", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> {getTranslatedText("Export en cours...", "Exporting...", "Exportando...")}</span>
            <span style={{ color: "#667eea", fontSize: "13px" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "#333", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #667eea, #764ba2)", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Bouton d'export */}
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        style={{
          padding: "10px 20px",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          color: "white",
          cursor: isExporting ? "wait" : "pointer",
          transition: "all 0.2s",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          opacity: isExporting ? 0.7 : 1
        }}
        onMouseEnter={(e) => { if (!isExporting) { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.borderColor = "#667eea"; } }}
        onMouseLeave={(e) => { if (!isExporting) { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#333"; } }}
      >
        {isExporting ? (
          <>
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <span>{Math.round(progress)}%</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {getTranslatedText("Exporter", "Export", "Exportar")}
            {exportMode === "selected" && selectedDisplayCount > 0 ? ` (${selectedDisplayCount})` : ` (${dataCount})`}
          </>
        )}
      </button>

      {showMenu && !isExporting && mounted && createPortal(
        <>
          <div onClick={() => setShowMenu(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, background: "transparent" }} />
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              transform: "translateX(-50%)",
              background: "#1a1a1a",
              border: "1px solid rgba(102,126,234,0.3)",
              borderRadius: "20px",
              padding: "20px",
              zIndex: 9999,
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              animation: "fadeInDown 0.2s ease",
              backdropFilter: "blur(10px)",
              minWidth: isMobile ? "320px" : "400px",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "8px solid rgba(102,126,234,0.3)" }} />
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #333" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
                          parent.style.display = "flex";
                          parent.style.alignItems = "center";
                          parent.style.justifyContent = "center";
                          parent.innerText = getInitials(user?.name || "U");
                          parent.style.fontSize = "18px";
                          parent.style.fontWeight = "bold";
                          parent.style.color = "white";
                        }
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>{getInitials(user?.name || "U")}</span>
                  )}
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>{user?.name || getTranslatedText("Export", "Export", "Exportar")}</div>
                  <div style={{ color: "#94a3b8", fontSize: "11px", display:"flex", alignItems:"center", gap:"4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> {dataCount} {recordsText}</div>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: "rgba(102,126,234,0.15)",
                  border: "1px solid rgba(102,126,234,0.3)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> {showSettings ? closeText : customizeText}
              </button>
            </div>

            <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(102,126,234,0.08)", borderRadius: "12px" }}>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "8px", fontWeight: "500", display:"flex", alignItems:"center", gap:"6px" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {exportModeText}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button 
                  onClick={() => setExportMode("all")}
                  style={{ flex: 1, padding: "8px 12px", background: exportMode === "all" ? "#667eea" : "rgba(255,255,255,0.05)", border: `1px solid ${exportMode === "all" ? "#667eea" : "#333"}`, borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> {allDataText} ({dataCount})
                </button>
                <button 
                  onClick={() => setExportMode("selected")}
                  style={{ flex: 1, padding: "8px 12px", background: exportMode === "selected" ? "#10b981" : "rgba(255,255,255,0.05)", border: `1px solid ${exportMode === "selected" ? "#10b981" : "#333"}`, borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: selectedDisplayCount === 0 ? 0.5 : 1 }} disabled={selectedDisplayCount === 0}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {selectedOnlyText} ({selectedDisplayCount})
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format, option.action)}
                  disabled={activeFormat === option.format || (exportMode === "selected" && selectedDisplayCount === 0)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "12px 8px",
                    background: activeFormat === option.format ? option.color : "rgba(255,255,255,0.05)",
                    border: `1px solid ${activeFormat === option.format ? option.color : "#333"}`,
                    borderRadius: "12px",
                    color: activeFormat === option.format ? "white" : option.color,
                    cursor: (activeFormat === option.format || (exportMode === "selected" && selectedDisplayCount === 0)) ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: (activeFormat === option.format || (exportMode === "selected" && selectedDisplayCount === 0)) ? 0.6 : 1
                  }}
                >
                  {activeFormat === option.format ? (
                    <div style={{ width: "20px", height: "20px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{option.icon}</span>
                  )}
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "white" }}>{option.label}</span>
                  <span style={{ fontSize: "9px", opacity: 0.7, color: "#94a3b8" }}>{option.desc}</span>
                </button>
              ))}
            </div>

            <div style={{ padding: "10px", background: "rgba(102,126,234,0.08)", borderRadius: "10px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
              💡 {dataCount > 1000 ? `⚠️ ${getTranslatedText("Export volumineux", "Large export", "Exportación grande")} (${dataCount.toLocaleString()} ${recordsText})` : `${dataCount.toLocaleString()} ${recordsText} ${getTranslatedText("à exporter", "to export", "para exportar")}`}
              {selectedDisplayCount > 0 && exportMode === "selected" && <span style={{ display: "block", marginTop: "5px", color: "#10b981" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",verticalAlign:"middle",marginRight:"4px"}}><polyline points="20 6 9 17 4 12"/></svg> ${selectedDisplayCount} ${getTranslatedText("élément(s) sélectionné(s)", "selected item(s)", "elemento(s) seleccionado(s)")}</span>}
              {dataCount > 10000 && <span style={{ display: "block", marginTop: "5px", color: "#f59e0b" }}>🔄 {getTranslatedText("Le traitement peut prendre quelques secondes", "Processing may take a few seconds", "El procesamiento puede tomar unos segundos")}</span>}
            </div>
          </div>
        </>,
        document.body
      )}

      {showSettings && mounted && createPortal(
        <div
          ref={settingsRef}
          style={{
            position: "fixed",
            top: menuPosition.top + 20,
            left: menuPosition.left,
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: "1px solid rgba(102,126,234,0.3)",
            borderRadius: "20px",
            padding: "20px",
            zIndex: 10000,
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            animation: "fadeInDown 0.2s ease",
            backdropFilter: "blur(10px)",
            minWidth: isMobile ? "320px" : "380px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto"
          }}
        >
          <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "8px solid rgba(102,126,234,0.3)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg><span style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>{customizeText}</span></div>
            <button onClick={() => setShowSettings(false)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 12px", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>✕ {closeText}</button>
          </div>

          {enableColumnSelection && selectedColumns.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "500", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> {columnsToExportText}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={selectAllColumns} style={{ padding: "4px 10px", background: "#667eea", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "10px" }}>✓ {selectAllText}</button>
                  <button onClick={selectNoneColumns} style={{ padding: "4px 10px", background: "#333", border: "none", borderRadius: "6px", color: "#94a3b8", cursor: "pointer", fontSize: "10px" }}>✗ {selectNoneText}</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "4px", background: "#0f0f0f", borderRadius: "10px" }}>
                {selectedColumns.map(col => (
                  <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px 8px", borderRadius: "6px", transition: "background 0.2s", color: "#94a3b8" }}>
                    <input type="checkbox" checked={col.selected} onChange={() => toggleColumn(col.key)} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                    <span style={{ fontSize: "12px" }}>{col.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>{selectedColumns.filter(c => c.selected).length} {columnsSelectedText}</div>
            </div>
          )}

          <div style={{ height: "1px", background: "#333", margin: "16px 0" }} />

          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: "500", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {dateFormatText}</div>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value as any)} style={{ width: "100%", padding: "10px 12px", background: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "13px" }}>
              <option value="locale">🌐 {localeDateText}</option>
              <option value="iso">📅 {isoDateText}</option>
              <option value="fr">🇫🇷 {frenchDateText}</option>
              <option value="us">🇺🇸 {usDateText}</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: "500", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> {csvSeparatorText}</div>
            <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "13px" }}>
              <option value=",">{commaText}</option>
              <option value=";">{semicolonText}</option>
              <option value="\t">{tabText}</option>
              <option value="|">{pipeText}</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: "500", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> {encodingText}</div>
            <select value={encoding} onChange={(e) => setEncoding(e.target.value as any)} style={{ width: "100%", padding: "10px 12px", background: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "13px" }}>
              <option value="UTF-8">🔤 UTF-8 ({encodingRecommendedText})</option>
              <option value="ISO-8859-1">📜 ISO-8859-1 ({encodingLatinText})</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#94a3b8" }}>
              <input type="checkbox" checked={includeHeaders} onChange={(e) => setIncludeHeaders(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <span style={{ fontSize: "13px", display:"flex", alignItems:"center", gap:"6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> {includeHeadersText}</span>
            </label>
          </div>

          <div style={{ height: "1px", background: "#333", margin: "16px 0" }} />
          <div style={{ fontSize: "11px", color: "#666", textAlign: "center", padding: "8px", display:"flex", alignItems:"center", justifyContent:"center", gap:"5px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> {maxRowsLimitText}: {maxRows.toLocaleString()} {recordsText}</div>
        </div>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
      ` }} />
    </div>
  );
}