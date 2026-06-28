"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ColumnConfig {
  key: string;
  label: string;
  visible?: boolean;
  format?: (value: any) => string;
  width?: number;
  align?: "left" | "center" | "right";
}

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: "utf-8" | "latin1";
  dateFormat?: string;
  dateLocale?: string;
  pdfOrientation?: "portrait" | "landscape";
  pdfPageSize?: "A4" | "Letter" | "Legal";
  csvQuoteChar?: string;
  csvEscapeChar?: string;
  jsonPretty?: boolean;
  zipPassword?: string;
  zipIncludeMetadata?: boolean;
  autoOpen?: boolean;
}

interface StyleConfig {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  hoverColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  animation?: boolean;
  position?: "fixed" | "absolute" | "relative";
  offsetTop?: number | "auto";
  offsetRight?: number | "auto";
  offsetBottom?: number | "auto";
  offsetLeft?: number | "auto";
  zIndex?: number;
  buttonSize?: "small" | "medium" | "large";
  floatingShape?: "circle" | "square" | "rounded";
  glassmorphism?: boolean;
  neonEffect?: boolean;
  gradient?: string;
}

interface ExportButtonsProps {
  data: any[];
  filename?: string;
  label?: string;
  formats?: ("json" | "csv" | "txt" | "pdf" | "xlsx" | "zip" | "doc" | "print")[];
  iconOnly?: boolean;
  showSuccess?: boolean;
  onExportStart?: () => void;
  onExportEnd?: () => void;
  customHeaders?: string[];
  customFileName?: string;
  dateFormat?: string;
  delimiter?: string;
  encoding?: "utf-8" | "latin1";
  includeHeaders?: boolean;
  sheetName?: string;
  pdfOrientation?: "portrait" | "landscape";
  pdfPageSize?: "A4" | "Letter" | "Legal";
  columns?: ColumnConfig[];
  exportOptions?: ExportOptions;
  styleConfig?: StyleConfig;
  filterConfig?: FilterConfig;
  onConfigChange?: (config: any) => void;
  onExportError?: (error: string) => void;
  onExportProgress?: (progress: number) => void;
  floating?: boolean;
  showFloatingButton?: boolean;
}

interface FilterConfig {
  columns?: string[];
  searchTerm?: string;
  minValue?: number;
  maxValue?: number;
  dateRange?: { start: Date; end: Date };
  status?: string[];
}

export default function ExportButtons({
  data: initialData = [],
  filename = "export",
  label,
  formats = ["json", "csv", "xlsx", "pdf"],
  iconOnly = false,
  showSuccess = true,
  onExportStart,
  onExportEnd,
  customHeaders,
  customFileName,
  dateFormat: propDateFormat = "yyyy-mm-dd",
  delimiter: propDelimiter = ",",
  encoding = "utf-8",
  includeHeaders = true,
  sheetName = "Export",
  pdfOrientation = "portrait",
  pdfPageSize = "A4",
  columns = [],
  exportOptions = {},
  styleConfig = {},
  filterConfig = {},
  onConfigChange,
  onExportError,
  onExportProgress,
  floating = false,
  showFloatingButton = true,
}: ExportButtonsProps) {
  // Ensure data is always an array
  const data = Array.isArray(initialData) ? initialData : [];
  
  const { t, language } = useLanguage();
  const [openMenu, setOpenMenu] = useState(false);
  const [openCustomizePanel, setOpenCustomizePanel] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<number>(6);
  const [watermark, setWatermark] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [encryption, setEncryption] = useState<boolean>(false);
  const [currentDelimiter, setCurrentDelimiter] = useState<string>(propDelimiter);
  const [activeTab, setActiveTab] = useState<"columns" | "format" | "security" | "advanced">("columns");
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const customizePanelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuAlign, setMenuAlign] = useState<"right" | "left">("right");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Merge options
  const mergedOptions = { 
    ...exportOptions, 
    filename: customFileName || filename, 
    sheetName, 
    includeHeaders, 
    delimiter: currentDelimiter, 
    encoding, 
    dateFormat: propDateFormat, 
    pdfOrientation, 
    pdfPageSize 
  };
  
  const getButtonSize = () => {
    switch (styleConfig.buttonSize) {
      case "small": return { padding: "8px 16px", fontSize: "13px", iconSize: 14, height: 36 };
      case "large": return { padding: "14px 28px", fontSize: "16px", iconSize: 20, height: 48 };
      default: return { padding: "10px 20px", fontSize: "14px", iconSize: 16, height: 42 };
    }
  };
  
  const getFloatingButtonSize = () => {
    switch (styleConfig.buttonSize) {
      case "small": return 48;
      case "large": return 72;
      default: return 60;
    }
  };
  
  const getFloatingShape = () => {
    switch (styleConfig.floatingShape) {
      case "square": return "16px";
      case "rounded": return "20px";
      default: return "50%";
    }
  };

  const getButtonGradient = () => {
    if (styleConfig.gradient) return styleConfig.gradient;
    return `linear-gradient(135deg, ${mergedStyle.primaryColor}, ${mergedStyle.accentColor})`;
  };

  const mergedStyle = {
    primaryColor: "#6366f1",
    accentColor: "#8b5cf6",
    backgroundColor: "#1e1e2e",
    hoverColor: "#2a2a3e",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    animation: false,
    position: "fixed" as const,
    offsetTop: 20,
    offsetRight: 20,
    offsetBottom: "auto" as const,
    offsetLeft: "auto" as const,
    zIndex: 9999,
    buttonSize: "medium" as const,
    floatingShape: "circle" as const,
    glassmorphism: false,
    neonEffect: false,
    ...styleConfig
  };

  const buttonSize = getButtonSize();
  const floatingButtonSize = getFloatingButtonSize();
  const floatingShape = getFloatingShape();
  const buttonGradient = getButtonGradient();

  // Translations
  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'export.button': { fr: 'Exporter', en: 'Export', es: 'Exportar' },
      'export.export_menu': { fr: "Menu d'export", en: 'Export Menu', es: 'Menú de exportación' },
      'export.customize': { fr: 'Personnaliser', en: 'Customize', es: 'Personalizar' },
      'export.customize_panel': { fr: 'Personnalisation', en: 'Customization', es: 'Personalización' },
      'export.columns_tab': { fr: 'Colonnes', en: 'Columns', es: 'Columnas' },
      'export.format_tab': { fr: 'Format', en: 'Format', es: 'Formato' },
      'export.security_tab': { fr: 'Sécurité', en: 'Security', es: 'Seguridad' },
      'export.advanced_tab': { fr: 'Avancé', en: 'Advanced', es: 'Avanzado' },
      'export.json': { fr: 'JSON', en: 'JSON', es: 'JSON' },
      'export.csv': { fr: 'CSV', en: 'CSV', es: 'CSV' },
      'export.txt': { fr: 'TXT', en: 'TXT', es: 'TXT' },
      'export.pdf': { fr: 'PDF', en: 'PDF', es: 'PDF' },
      'export.excel': { fr: 'Excel', en: 'Excel', es: 'Excel' },
      'export.zip': { fr: 'ZIP', en: 'ZIP', es: 'ZIP' },
      'export.word': { fr: 'Word', en: 'Word', es: 'Word' },
      'export.print': { fr: 'Imprimer', en: 'Print', es: 'Imprimir' },
      'export.select_all': { fr: 'Tout sélectionner', en: 'Select all', es: 'Seleccionar todo' },
      'export.deselect_all': { fr: 'Tout désélectionner', en: 'Deselect all', es: 'Deseleccionar todo' },
      'export.compression': { fr: 'Compression', en: 'Compression', es: 'Compresión' },
      'export.watermark': { fr: 'Filigrane', en: 'Watermark', es: 'Marca de agua' },
      'export.password': { fr: 'Mot de passe', en: 'Password', es: 'Contraseña' },
      'export.encryption': { fr: 'Chiffrement', en: 'Encryption', es: 'Cifrado' },
      'export.delimiter': { fr: 'Séparateur', en: 'Delimiter', es: 'Separador' },
      'export.orientation': { fr: 'Orientation', en: 'Orientation', es: 'Orientación' },
      'export.portrait': { fr: 'Portrait', en: 'Portrait', es: 'Retrato' },
      'export.landscape': { fr: 'Paysage', en: 'Landscape', es: 'Paisaje' },
      'export.date_format': { fr: 'Format date', en: 'Date format', es: 'Formato fecha' },
      'export.success_json': { fr: 'enregistrement(s) exporté(s) en JSON', en: 'record(s) exported as JSON', es: 'registro(s) exportado(s) como JSON' },
      'export.success_csv': { fr: 'enregistrement(s) exporté(s) en CSV', en: 'record(s) exported as CSV', es: 'registro(s) exportado(s) como CSV' },
      'export.success_txt': { fr: 'enregistrement(s) exporté(s) en TXT', en: 'record(s) exported as TXT', es: 'registro(s) exportado(s) como TXT' },
      'export.success_pdf': { fr: 'PDF généré', en: 'PDF generated', es: 'PDF generado' },
      'export.success_excel': { fr: 'enregistrement(s) exporté(s) vers Excel', en: 'record(s) exported to Excel', es: 'registro(s) exportado(s) a Excel' },
      'export.success_zip': { fr: 'enregistrement(s) exporté(s) en archive ZIP', en: 'record(s) exported as ZIP', es: 'registro(s) exportado(s) como ZIP' },
      'export.success_word': { fr: 'enregistrement(s) exporté(s) vers Word', en: 'record(s) exported to Word', es: 'registro(s) exportado(s) a Word' },
      'export.success_print': { fr: 'Impression envoyée', en: 'Print sent', es: 'Impresión enviada' },
      'export.zip_note': { fr: "ZIP nécessite JSZip", en: "ZIP requires JSZip", es: "ZIP requiere JSZip" },
      'export.records': { fr: 'enregistrement(s)', en: 'record(s)', es: 'registro(s)' },
      'export.lines': { fr: 'lignes', en: 'lines', es: 'líneas' },
      'export.export_as': { fr: 'Exporter en tant que', en: 'Export as', es: 'Exportar como' },
      'export.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
      'export.apply': { fr: 'Appliquer', en: 'Apply', es: 'Aplicar' },
      'export.cancel': { fr: 'Annuler', en: 'Cancel', es: 'Cancelar' },
      'export.reset': { fr: 'Réinitialiser', en: 'Reset', es: 'Reiniciar' },
      'export.quick_export': { fr: 'Export rapide', en: 'Quick Export', es: 'Exportación rápida' },
      'export.advanced_export': { fr: 'Export avancé', en: 'Advanced Export', es: 'Exportación avanzada' },
      'export.records_count': { fr: 'enregistrements', en: 'records', es: 'registros' },
      'export.ready': { fr: 'Prêt à exporter', en: 'Ready to export', es: 'Listo para exportar' },
      'export.select_columns': { fr: 'Sélectionnez les colonnes à exporter', en: 'Select columns to export', es: 'Seleccione las columnas a exportar' },
      'export.csv_delimiter': { fr: 'Séparateur CSV', en: 'CSV Delimiter', es: 'Separador CSV' },
      'export.pdf_orientation': { fr: 'Orientation PDF', en: 'PDF Orientation', es: 'Orientación PDF' },
      'export.date_format_label': { fr: 'Format de date', en: 'Date format', es: 'Formato de fecha' },
      'export.watermark_label': { fr: 'Filigrane', en: 'Watermark', es: 'Marca de agua' },
      'export.compression_level': { fr: 'Niveau de compression ZIP', en: 'ZIP Compression Level', es: 'Nivel de compresión ZIP' },
      'export.compression_none': { fr: 'Aucune (0)', en: 'None (0)', es: 'Ninguna (0)' },
      'export.compression_normal': { fr: 'Normal (6)', en: 'Normal (6)', es: 'Normal (6)' },
      'export.compression_max': { fr: 'Maximum (9)', en: 'Maximum (9)', es: 'Máximo (9)' },
      'export.encoding': { fr: 'Encodage', en: 'Encoding', es: 'Codificación' },
      'export.tab_delimiter': { fr: 'TABULATION', en: 'TAB', es: 'TABULACIÓN' },
      'export.date_format_iso': { fr: 'AAAA-MM-JJ', en: 'YYYY-MM-DD', es: 'AAAA-MM-DD' },
      'export.date_format_eu': { fr: 'JJ/MM/AAAA', en: 'DD/MM/YYYY', es: 'DD/MM/AAAA' },
      'export.date_format_us': { fr: 'MM/JJ/AAAA', en: 'MM/DD/YYYY', es: 'MM/DD/AAAA' },
      'export.select_all_short': { fr: 'Tout', en: 'All', es: 'Todo' },
      'export.deselect_all_short': { fr: 'Rien', en: 'None', es: 'Nada' },
      'common.close': { fr: 'Fermer', en: 'Close', es: 'Cerrar' },
    };
    
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
      if (customizePanelRef.current && !customizePanelRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpenCustomizePanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const computeDropdownPos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 300;
    const spaceOnRight = window.innerWidth - rect.right;
    if (spaceOnRight < menuWidth) {
      setDropdownPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
      setMenuAlign("right");
    } else {
      setDropdownPos({ top: rect.bottom + 12, left: rect.left });
      setMenuAlign("left");
    }
  };

  // Initialize selected columns
  useEffect(() => {
    const allColumns = getAvailableColumns();
    if (selectedColumns.length === 0 && allColumns.length > 0) {
      setSelectedColumns(allColumns.map(c => c.key));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns]);

  const showSuccessMsg = (msg: string) => {
    if (!showSuccess) return;
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportStart = () => {
    setExporting(true);
    setProgress(0);
    onExportStart?.();
    if (onExportProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) clearInterval(interval);
          onExportProgress(Math.min(newProgress, 95));
          return Math.min(newProgress, 95);
        });
      }, 200);
    }
  };

  const handleExportEnd = () => {
    setProgress(100);
    onExportProgress?.(100);
    setTimeout(() => {
      setExporting(false);
      setProgress(0);
      onExportEnd?.();
    }, 500);
  };

  const handleExportError = (error: string) => {
    setExporting(false);
    onExportError?.(error);
    showSuccessMsg(`${getTranslation('export.error')}: ${error}`);
  };

  const getAvailableColumns = (): ColumnConfig[] => {
    if (columns.length > 0) return columns;
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map(key => ({ key, label: key, visible: true }));
  };

  const getFilteredData = () => {
    // Ensure data is an array before spreading
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    let filtered = [...data];
    
    if (filterConfig.searchTerm) {
      const term = filterConfig.searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(term)
        )
      );
    }
    
    if (filterConfig.columns && filterConfig.columns.length > 0) {
      filtered = filtered.map(row => {
        const newRow: any = {};
        filterConfig.columns!.forEach(col => {
          if (row[col] !== undefined) newRow[col] = row[col];
        });
        return newRow;
      });
    }
    
    if (filterConfig.minValue !== undefined || filterConfig.maxValue !== undefined) {
      filtered = filtered.filter(row => {
        let valid = true;
        Object.values(row).forEach(val => {
          const num = Number(val);
          if (!isNaN(num)) {
            if (filterConfig.minValue !== undefined && num < filterConfig.minValue!) valid = false;
            if (filterConfig.maxValue !== undefined && num > filterConfig.maxValue!) valid = false;
          }
        });
        return valid;
      });
    }
    
    if (filterConfig.dateRange) {
      filtered = filtered.filter(row => {
        let hasValidDate = false;
        let dateValid = true;
        Object.values(row).forEach(val => {
          const date = new Date(val as string | number | Date);
          if (!isNaN(date.getTime())) {
            hasValidDate = true;
            if (date < filterConfig.dateRange!.start || date > filterConfig.dateRange!.end) {
              dateValid = false;
            }
          }
        });
        return !hasValidDate || dateValid;
      });
    }
    
    return filtered;
  };

  const getHeaders = () => {
    const availableColumns = getAvailableColumns();
    if (selectedColumns.length > 0) {
      return selectedColumns.map(key => {
        const col = availableColumns.find(c => c.key === key);
        return col?.label || key;
      });
    }
    // Fallback : toutes les colonnes si aucune sélection
    if (customHeaders && customHeaders.length > 0) return customHeaders;
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const getColumnKeys = () => {
    if (selectedColumns.length > 0) return selectedColumns;
    // Fallback : toutes les clés si aucune sélection
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const formatValue = (key: string, value: any): string => {
    const availableColumns = getAvailableColumns();
    const column = availableColumns.find(c => c.key === key);
    if (column?.format) return column.format(value);
    if (value instanceof Date) {
      const format = mergedOptions.dateFormat || "yyyy-mm-dd";
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return format.replace('yyyy', String(year)).replace('mm', month).replace('dd', day);
    }
    return value == null ? "" : String(value);
  };

  const getFormattedFilename = (extension: string) => {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace(/:/g, "-");
    const baseName = customFileName || filename;
    return `${baseName}_${formattedDate}.${extension}`;
  };

  const escapeCSV = (val: any) => {
    const quoteChar = mergedOptions.csvQuoteChar || '"';
    const escapeChar = mergedOptions.csvEscapeChar || '"';
    const str = val == null ? "" : String(val);
    if (str.includes(currentDelimiter) || str.includes(quoteChar) || str.includes("\n")) {
      return `${quoteChar}${str.replace(new RegExp(escapeChar, 'g'), escapeChar + escapeChar)}${quoteChar}`;
    }
    return str;
  };

  const generateCSV = () => {
    const headers = getHeaders();
    const keys = getColumnKeys();
    const rows = includeHeaders ? [headers.join(currentDelimiter)] : [];
    
    const filteredData = getFilteredData();
    filteredData.forEach((row) => {
      const values = keys.map((key) => escapeCSV(formatValue(key, row[key])));
      rows.push(values.join(currentDelimiter));
    });
    return rows.join("\n");
  };

  const generateTXT = () => {
    const headers = getHeaders();
    const keys = getColumnKeys();
    const lines: string[] = [];
    const filteredData = getFilteredData();
    
    if (includeHeaders) {
      lines.push("=".repeat(80));
      lines.push(`EXPORT REPORT - ${new Date().toLocaleString()}`);
      lines.push("=".repeat(80));
      lines.push("");
      lines.push(headers.join(" | "));
      lines.push("-".repeat(80));
    }
    
    filteredData.forEach((row) => {
      const values = keys.map((key) => formatValue(key, row[key]) || "-");
      lines.push(values.join(" | "));
    });
    
    if (filteredData.length > 0) {
      lines.push("");
      lines.push("-".repeat(80));
      lines.push(`Total records: ${filteredData.length}`);
      lines.push(`Export date: ${new Date().toLocaleString()}`);
      if (watermark) lines.push(`Watermark: ${watermark}`);
    }
    
    return lines.join("\n");
  };

  const generateHTML = (title: string, forPrint: boolean = false) => {
    const headers = getHeaders();
    const keys = getColumnKeys();
    const filteredData = getFilteredData();
    const alignments: Record<string, string> = {};
    getAvailableColumns().forEach(col => { if (col.align) alignments[col.key] = col.align; });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: ${mergedStyle.fontFamily}; margin: 40px; background: white; }
            h1 { color: ${mergedStyle.primaryColor}; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th { background: ${mergedStyle.primaryColor}; color: white; padding: 10px; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            ${forPrint ? '@media print { body { margin: 2cm; } @page { size: ' + pdfPageSize + ' ' + pdfOrientation + '; } }' : ''}
            ${watermark ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 60px; white-space: nowrap; pointer-events: none; z-index: 999; }` : ''}
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${watermark ? `<div class="watermark">${escapeHtml(watermark)}</div>` : ''}
          <h1>${escapeHtml(title)}</h1>
          <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th class="text-${alignments[h] || 'left'}">${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  ${keys.map(key => `<td class="text-${alignments[key] || 'left'}">${escapeHtml(formatValue(key, row[key]))}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Total Records: ${filteredData.length} | Generated by Inovexa ERP</p>
            ${watermark ? `<p>Watermark: ${escapeHtml(watermark)}</p>` : ''}
          </div>
        </body>
      </html>
    `;
  };

  // Export functions
  const exportJSON = async () => {
    handleExportStart();
    try {
      const filteredData = getFilteredData();
      const content = mergedOptions.jsonPretty !== false ? JSON.stringify(filteredData, null, 2) : JSON.stringify(filteredData);
      let blob = new Blob([content], { type: "application/json" });
      
      if (encryption && password) {
        blob = await encryptBlob(blob, password);
      }
      
      triggerDownload(blob, getFormattedFilename("json"));
      showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_json')}`);
      onConfigChange?.({ lastExport: new Date(), format: "json", count: filteredData.length });
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportCSV = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const content = generateCSV();
      const blob = new Blob([content], { type: `text/csv;charset=${encoding};` });
      triggerDownload(blob, getFormattedFilename("csv"));
      showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_csv')}`);
      onConfigChange?.({ lastExport: new Date(), format: "csv", count: filteredData.length });
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportTXT = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const content = generateTXT();
      const blob = new Blob([content], { type: `text/plain;charset=${encoding};` });
      triggerDownload(blob, getFormattedFilename("txt"));
      showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_txt')}`);
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportXLSX = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const htmlContent = generateHTML(sheetName, false);
      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
      triggerDownload(blob, getFormattedFilename("xlsx"));
      showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_excel')}`);
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportDOC = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const htmlContent = generateHTML(sheetName, false);
      const blob = new Blob([htmlContent], { type: "application/msword" });
      triggerDownload(blob, getFormattedFilename("doc"));
      showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_word')}`);
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportPDF = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const htmlContent = generateHTML(sheetName, true);
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(htmlContent);
      printWindow?.document.close();
      printWindow?.print();
      showSuccessMsg(getTranslation('export.success_pdf'));
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportPrint = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const htmlContent = generateHTML(sheetName, true);
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(htmlContent);
      printWindow?.document.close();
      printWindow?.print();
      showSuccessMsg(getTranslation('export.success_print'));
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const exportZIP = async () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) { handleExportError("No data to export"); return; }
    handleExportStart();
    try {
      const jsonContent = mergedOptions.jsonPretty !== false ? JSON.stringify(filteredData, null, 2) : JSON.stringify(filteredData);
      const csvContent = generateCSV();
      const txtContent = generateTXT();
      const htmlContent = generateHTML(sheetName, false);
      
      const zipContent: { [key: string]: string } = {
        [`${filename}_data.json`]: jsonContent,
        [`${filename}_data.csv`]: csvContent,
        [`${filename}_report.txt`]: txtContent,
        [`${filename}_report.html`]: htmlContent,
      };
      
      if (mergedOptions.zipIncludeMetadata !== false) {
        zipContent[`${filename}_metadata.txt`] = `Export Date: ${new Date().toLocaleString()}
Total Records: ${filteredData.length}
Format: Multiple formats
Columns: ${getHeaders().join(", ")}
Watermark: ${watermark || "None"}
Generated by Inovexa ERP`;
      }
      
      if (typeof window !== "undefined" && !(window as any).JSZip) {
        showSuccessMsg(getTranslation('export.zip_note'));
        exportJSON();
        setTimeout(() => exportCSV(), 100);
      } else {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        let compression = compressionLevel > 0 ? "DEFLATE" : "STORE";
        let compressionOptions = compressionLevel > 0 ? { level: Math.min(compressionLevel, 9) } : undefined;
        
        Object.entries(zipContent).forEach(([name, content]) => {
          zip.file(name, content, { compression, compressionOptions });
        });
        
        let blob = await zip.generateAsync({ type: "blob", compression, compressionOptions });
        
        if (encryption && password) {
          blob = await encryptBlob(blob, password);
        }
        
        triggerDownload(blob, getFormattedFilename("zip"));
        showSuccessMsg(`${filteredData.length} ${getTranslation('export.success_zip')}`);
      }
    } catch (err) {
      handleExportError(String(err));
    }
    handleExportEnd();
    setOpenMenu(false);
  };

  const encryptBlob = async (blob: Blob, pwd: string): Promise<Blob> => {
    const text = await blob.text();
    const encrypted = btoa(pwd + ":" + text);
    return new Blob([encrypted], { type: "application/octet-stream" });
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    if (mergedOptions.autoOpen !== false && (name.endsWith('.pdf') || name.endsWith('.html'))) {
      window.open(url, '_blank');
    }
  };

  const escapeHtml = (str: any) => {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const handleExport = (format: string) => {
    if (exporting) return;
    switch (format) {
      case "json": exportJSON(); break;
      case "csv": exportCSV(); break;
      case "txt": exportTXT(); break;
      case "pdf": exportPDF(); break;
      case "xlsx": exportXLSX(); break;
      case "zip": exportZIP(); break;
      case "doc": exportDOC(); break;
      case "print": exportPrint(); break;
      default: break;
    }
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    const allKeys = getAvailableColumns().map(c => c.key);
    setSelectedColumns(allKeys);
  };

  const deselectAllColumns = () => {
    const allColumns = getAvailableColumns();
    // Garde au moins la première colonne pour éviter un export vide
    if (allColumns.length > 0) {
      setSelectedColumns([allColumns[0].key]);
    } else {
      setSelectedColumns([]);
    }
  };

  const resetSettings = () => {
    setSelectedColumns(getAvailableColumns().map(c => c.key));
    setCompressionLevel(6);
    setWatermark("");
    setPassword("");
    setEncryption(false);
    setCurrentDelimiter(propDelimiter);
  };

  const applySettings = () => {
    onConfigChange?.({
      selectedColumns,
      compressionLevel,
      watermark,
      encryption,
      delimiter: currentDelimiter
    });
    setOpenCustomizePanel(false);
    showSuccessMsg("Configuration appliquée");
  };

  const formatMeta: Record<string, { label: string; icon: React.ReactNode; color: string; group: "quick" | "advanced"; description: string }> = {
    csv: { 
      label: getTranslation('export.csv'), 
      color: "#10b981", 
      group: "quick", 
      description: "Comma Separated Values - Idéal pour tableaux",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg> 
    },
    xlsx: { 
      label: getTranslation('export.excel'), 
      color: "#22c55e", 
      group: "quick", 
      description: "Microsoft Excel - Format tableur complet",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg> 
    },
    pdf: { 
      label: getTranslation('export.pdf'), 
      color: "#ef4444", 
      group: "quick", 
      description: "Portable Document Format - Document universel",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> 
    },
    json: { 
      label: getTranslation('export.json'), 
      color: "#f59e0b", 
      group: "advanced", 
      description: "JavaScript Object Notation - Format structuré",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> 
    },
    txt: { 
      label: getTranslation('export.txt'), 
      color: "#6b7280", 
      group: "advanced", 
      description: "Texte brut - Format lisible",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> 
    },
    zip: { 
      label: getTranslation('export.zip'), 
      color: "#8b5cf6", 
      group: "advanced", 
      description: "Archive compressée - Multi-format",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v8H3V8" /><polyline points="16 4 12 8 8 4" /></svg> 
    },
    doc: { 
      label: getTranslation('export.word'), 
      color: "#3b82f6", 
      group: "advanced", 
      description: "Microsoft Word - Document texte",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> 
    },
    print: { 
      label: getTranslation('export.print'), 
      color: "#94a3b8", 
      group: "advanced", 
      description: "Impression directe",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3h12v6" /><path d="M6 21H4a2 2 0 01-2-2v-6a2 2 0 012-2h16a2 2 0 012 2v6a2 2 0 01-2 2h-2" /><rect x="8" y="15" width="8" height="6" /></svg> 
    },
  };

  const filteredDataCount = getFilteredData().length;

  const tabsConfig: { id: string; label: string; icon: React.ReactNode }[] = [
    {
      id: "columns",
      label: getTranslation('export.columns_tab'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      ),
    },
    {
      id: "format",
      label: getTranslation('export.format_tab'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
    },
    {
      id: "security",
      label: getTranslation('export.security_tab'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
    },
    {
      id: "advanced",
      label: getTranslation('export.advanced_tab'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/>
        </svg>
      ),
    },
  ];

  const getFloatingStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: mergedStyle.position,
      zIndex: mergedStyle.zIndex,
    };
    
    if (mergedStyle.offsetTop !== undefined && mergedStyle.offsetTop !== "auto") {
      baseStyle.top = `${mergedStyle.offsetTop}px`;
    }
    if (mergedStyle.offsetRight !== undefined && mergedStyle.offsetRight !== "auto") {
      baseStyle.right = `${mergedStyle.offsetRight}px`;
    }
    if (mergedStyle.offsetBottom !== undefined && mergedStyle.offsetBottom !== "auto") {
      baseStyle.bottom = `${mergedStyle.offsetBottom}px`;
    }
    if (mergedStyle.offsetLeft !== undefined && mergedStyle.offsetLeft !== "auto") {
      baseStyle.left = `${mergedStyle.offsetLeft}px`;
    }
    
    return baseStyle;
  };

  // Version flottante avec bouton amélioré
  if (floating && showFloatingButton) {
    const buttonNeonStyle = mergedStyle.neonEffect ? {
      boxShadow: `0 0 20px ${mergedStyle.primaryColor}80, 0 0 40px ${mergedStyle.primaryColor}40`,
      border: `1px solid ${mergedStyle.primaryColor}40`,
    } : { boxShadow: "0 4px 20px rgba(0,0,0,0.3)" };

    return (
      <>
        <div ref={menuRef} style={getFloatingStyle()}>
          <div style={{ position: "relative" }}>
            <button
              ref={buttonRef}
              onClick={() => setOpenMenu(!openMenu)}
              disabled={data.length === 0 || exporting}
              style={{
                width: floatingButtonSize,
                height: floatingButtonSize,
                borderRadius: floatingShape,
                background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.8)` : buttonGradient,
                backdropFilter: mergedStyle.glassmorphism ? "blur(10px)" : "none",
                border: "none",
                color: "white",
                cursor: data.length === 0 || exporting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: buttonSize.iconSize + 4,
                transition: mergedStyle.animation ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                opacity: data.length === 0 || exporting ? 0.5 : 1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
              }}

              title={getTranslation('export.button')}
            >

              <svg width={buttonSize.iconSize + 2} height={buttonSize.iconSize + 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              
              {exporting && (
                <div style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "pulse 1.5s infinite",
                  border: `2px solid ${mergedStyle.backgroundColor}`,
                }} />
              )}
              
              {/* Progress ring */}
              {exporting && progress > 0 && progress < 100 && (
                <svg style={{
                  position: "absolute",
                  top: -2,
                  left: -2,
                  width: floatingButtonSize + 4,
                  height: floatingButtonSize + 4,
                  transform: "rotate(-90deg)",
                }}>
                  <circle
                    cx={(floatingButtonSize + 4) / 2}
                    cy={(floatingButtonSize + 4) / 2}
                    r={(floatingButtonSize + 4) / 2 - 2}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={(floatingButtonSize + 4) / 2}
                    cy={(floatingButtonSize + 4) / 2}
                    r={(floatingButtonSize + 4) / 2 - 2}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * ((floatingButtonSize + 4) / 2 - 2)}`}
                    strokeDashoffset={`${2 * Math.PI * ((floatingButtonSize + 4) / 2 - 2) * (1 - progress / 100)}`}
                    style={{ }}
                  />
                </svg>
              )}
            </button>

            {/* Menu déroulant amélioré */}
            {openMenu && (
              <div
                ref={menuRef}
                style={{
                  position: "absolute",
                  bottom: floatingButtonSize + 16,
                  right: 0,
                  background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.95)` : mergedStyle.backgroundColor,
                  backdropFilter: mergedStyle.glassmorphism ? "blur(20px)" : "none",
                  borderRadius: "20px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
                  minWidth: "320px",
                  overflow: "hidden",
                  border: `1px solid ${mergedStyle.primaryColor}30`,
                  animation: "none",
                }}
              >
                {/* Header with stats */}
                <div style={{
                  padding: "18px 20px",
                  background: `linear-gradient(135deg, ${mergedStyle.primaryColor}20, transparent)`,
                  borderBottom: `1px solid ${mergedStyle.primaryColor}20`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {getTranslation('export.export_menu')}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                        {filteredDataCount} {getTranslation('export.records_count')} • {getTranslation('export.ready')}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenCustomizePanel(true)}
                      style={{
                        padding: "8px 14px",
                        background: `${mergedStyle.primaryColor}20`,
                        border: `1px solid ${mergedStyle.primaryColor}40`,
                        borderRadius: "10px",
                        color: mergedStyle.primaryColor,
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {}}
                      onMouseLeave={(e) => {}}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      {getTranslation('export.customize')}
                    </button>
                  </div>
                </div>
                
                {/* Export rapide */}
                <div style={{ padding: "12px 0" }}>
                  <div style={{ padding: "8px 20px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>
                    {getTranslation('export.quick_export')}
                  </div>
                  {Object.entries(formatMeta).filter(([_, meta]) => meta.group === "quick").map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => handleExport(key)}
                      onMouseEnter={() => setHoveredFormat(key)}
                      onMouseLeave={() => setHoveredFormat(null)}
                      style={{
                        width: "100%",
                        padding: "12px 20px",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "14px",
                        position: "relative",
                      }}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: `${meta.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: meta.color,
                      }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: "600" }}>{meta.label}</div>
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{meta.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${mergedStyle.primaryColor}40, transparent)`, margin: "4px 20px" }} />
                
                {/* Export avancé */}
                <div style={{ padding: "8px 0 12px" }}>
                  <div style={{ padding: "8px 20px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>
                    {getTranslation('export.advanced_export')}
                  </div>
                  {Object.entries(formatMeta).filter(([_, meta]) => meta.group === "advanced").map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => handleExport(key)}
                      style={{
                        width: "100%",
                        padding: "10px 20px",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: meta.color, width: "20px" }}>{meta.icon}</span>
                      <span>{meta.label}</span>
                      <span style={{ fontSize: "10px", color: "#555", marginLeft: "auto" }}>{meta.description.substring(0, 30)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de personnalisation */}
        {openCustomizePanel && (
          <div
            ref={customizePanelRef}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.98)` : mergedStyle.backgroundColor,
              backdropFilter: mergedStyle.glassmorphism ? "blur(20px)" : "none",
              borderRadius: "24px",
              zIndex: 10001,
              width: "520px",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              border: `1px solid ${mergedStyle.primaryColor}30`,
              animation: "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ 
              padding: "20px 24px", 
              borderBottom: `1px solid ${mergedStyle.primaryColor}20`,
              background: `linear-gradient(135deg, ${mergedStyle.primaryColor}10, transparent)`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: "bold", color: "white", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  {getTranslation('export.customize_panel')}
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px" }}>
                  {filteredDataCount} {getTranslation('export.records')}
                </div>
              </div>
              <button
                onClick={() => setOpenCustomizePanel(false)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", color: "#94a3b8", cursor: "pointer", padding: "8px 12px", }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", padding: "16px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {tabsConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "10px 18px",
                    background: activeTab === tab.id ? mergedStyle.primaryColor : "transparent",
                    border: "none",
                    borderRadius: "12px 12px 0 0",
                    color: activeTab === tab.id ? "white" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: activeTab === tab.id ? "600" : "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {activeTab === "columns" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>{getTranslation('export.select_columns')}</span>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button onClick={selectAllColumns} style={{ fontSize: "12px", background: "none", border: "none", color: mergedStyle.primaryColor, cursor: "pointer", padding: "4px 8px", borderRadius: "6px", }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${mergedStyle.primaryColor}20`}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px"}}><polyline points="20 6 9 17 4 12"/></svg>{getTranslation('export.select_all_short')}</>
                      </button>
                      <button onClick={deselectAllColumns} style={{ fontSize: "12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", }}>
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{getTranslation('export.deselect_all_short')}</>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", maxHeight: "350px", overflowY: "auto" }}>
                    {getAvailableColumns().map(col => (
                      <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#94a3b8", cursor: "pointer", padding: "8px 12px", borderRadius: "10px", }}
                      >
                        <input type="checkbox" checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} style={{ width: "18px", height: "18px", cursor: "pointer", borderRadius: "4px", accentColor: mergedStyle.primaryColor }} />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "format" && (
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.csv_delimiter')}</label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {[",", ";", "\t", "|"].map(d => (
                        <button key={d} onClick={() => setCurrentDelimiter(d)} style={{ padding: "8px 16px", background: currentDelimiter === d ? mergedStyle.primaryColor : "rgba(255,255,255,0.05)", border: currentDelimiter === d ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: "13px", cursor: "pointer", }}>
                          {d === '\t' ? getTranslation('export.tab_delimiter') : d}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.pdf_orientation')}</label>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", cursor: "pointer" }}>
                        <input type="radio" name="pdfOrientation" checked={pdfOrientation === "portrait"} onChange={() => {}} style={{ accentColor: mergedStyle.primaryColor }} /> Portrait
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", cursor: "pointer" }}>
                        <input type="radio" name="pdfOrientation" checked={pdfOrientation === "landscape"} onChange={() => {}} style={{ accentColor: mergedStyle.primaryColor }} /> Paysage
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.date_format_label')}</label>
                    <select value={propDateFormat} onChange={(e) => {}} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer" }}>
                      <option value="yyyy-mm-dd">{getTranslation('export.date_format_iso')}</option>
                      <option value="dd/mm/yyyy">{getTranslation('export.date_format_eu')}</option>
                      <option value="mm/dd/yyyy">{getTranslation('export.date_format_us')}</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.watermark_label')}</label>
                    <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="Ex: CONFIDENTIEL" style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px" }} />
                  </div>
                  
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", fontSize: "13px", color: "#94a3b8", cursor: "pointer", fontWeight: "500" }}>
                      <input type="checkbox" checked={encryption} onChange={(e) => setEncryption(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: mergedStyle.primaryColor }} />
                      Activer le chiffrement
                    </label>
                    {encryption && (
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", marginTop: "12px" }} />
                    )}
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.compression_level')}</label>
                    <input type="range" min="0" max="9" value={compressionLevel} onChange={(e) => setCompressionLevel(parseInt(e.target.value))} style={{ width: "100%", accentColor: mergedStyle.primaryColor }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "8px" }}>
                      <span>{getTranslation('export.compression_none')}</span><span>{getTranslation('export.compression_normal')}</span><span>{getTranslation('export.compression_max')}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.encoding')}</label>
                    <select value={encoding} onChange={(e) => {}} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer" }}>
                      <option value="utf-8">UTF-8</option>
                      <option value="latin1">Latin-1 (ISO-8859-1)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "12px" }}>
              <button onClick={resetSettings} style={{ flex: 1, padding: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#f87171", cursor: "pointer", fontSize: "14px", fontWeight: "500", }}>
                {getTranslation('export.reset')}
              </button>
              <button onClick={applySettings} style={{ flex: 1, padding: "12px", background: buttonGradient, border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", }}>
                {getTranslation('export.apply')}
              </button>
            </div>
          </div>
        )}

        {/* Overlay */}
        {(openMenu || openCustomizePanel) && (
          <div
            onClick={() => {
              setOpenMenu(false);
              setOpenCustomizePanel(false);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.5)",

            }}
          />
        )}

        <SuccessToast msg={success} />
        {exporting && <ProgressBar progress={progress} />}

        <style dangerouslySetInnerHTML={{ __html: `
          
          
          
          
          
          @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
          
          button:active .ripple {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
            transition: transform 0.5s, opacity 0.5s;
          }
        ` }} />
      </>
    );
  }

  // Version non-flottante avec bouton amélioré
  const filteredDataCountNonFloating = getFilteredData().length;

  return (
    <>
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          ref={buttonRef}
          onClick={() => {
            if (!openMenu) computeDropdownPos();
            setOpenMenu(!openMenu);
          }}
          disabled={data.length === 0 || exporting}
          style={{
            padding: buttonSize.padding,
            background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.8)` : buttonGradient,
            backdropFilter: mergedStyle.glassmorphism ? "blur(10px)" : "none",
            border: "none",
            borderRadius: mergedStyle.borderRadius,
            color: "white",
            cursor: data.length === 0 || exporting ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontSize: buttonSize.fontSize,
            fontFamily: mergedStyle.fontFamily,
            fontWeight: "600",
            transition: mergedStyle.animation ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            opacity: data.length === 0 || exporting ? 0.5 : 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            height: buttonSize.height,
          }}

        >
          <svg width={buttonSize.iconSize} height={buttonSize.iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {!iconOnly && (label ?? getTranslation('export.button'))}
          {exporting && (
            <div style={{ marginLeft: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "12px" }}>{progress}%</span>
            </div>
          )}
          {!iconOnly && !exporting && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{}}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>

        {/* Menu déroulant — bottom sheet sur mobile, dropdown sur desktop */}
        {openMenu && typeof document !== "undefined" && createPortal(
          <>
            {/* Mobile bottom sheet */}
            {isMobile && (
              <div
                ref={menuRef}
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: mergedStyle.glassmorphism ? `rgba(22, 22, 35, 0.99)` : mergedStyle.backgroundColor,
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${mergedStyle.primaryColor}30`,
                  borderRadius: "24px 24px 0 0",
                  zIndex: 99999,
                  maxHeight: "85vh",
                  overflowY: "auto",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
                  
                }}
              >
                {/* Handle bar */}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                  <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
                </div>

                {/* Header */}
                <div style={{
                  padding: "12px 20px 14px",
                  borderBottom: `1px solid ${mergedStyle.primaryColor}20`,
                  background: `linear-gradient(135deg, ${mergedStyle.primaryColor}10, transparent)`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "white", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {getTranslation('export.export_menu')}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>{filteredDataCountNonFloating} {getTranslation('export.records')}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setOpenMenu(false); setOpenCustomizePanel(true); }}
                      style={{ padding: "8px 14px", background: `${mergedStyle.primaryColor}20`, border: `1px solid ${mergedStyle.primaryColor}40`, borderRadius: "10px", color: mergedStyle.primaryColor, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      {getTranslation('export.customize')}
                    </button>
                    <button onClick={() => setOpenMenu(false)} style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                {/* Format grid — 2 columns on mobile */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "16px" }}>
                  {Object.entries(formatMeta).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => handleExport(key)}
                      style={{
                        padding: "14px 12px",
                        background: `${meta.color}12`,
                        border: `1px solid ${meta.color}25`,
                        borderRadius: "14px",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "13px",
                        textAlign: "left",
                        minHeight: "72px",
                      }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${meta.color}25`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{meta.label}</div>
                        <div style={{ fontSize: "10px", color: "#666", marginTop: "1px" }}>{filteredDataCountNonFloating} {getTranslation('export.lines')}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Safe area bottom padding */}
                <div style={{ height: "env(safe-area-inset-bottom, 16px)", minHeight: "16px" }} />
              </div>
            )}

            {/* Desktop dropdown — unchanged */}
            {!isMobile && dropdownPos && (
              <div
                ref={menuRef}
                style={{
                  position: "fixed",
                  top: dropdownPos.top,
                  ...(dropdownPos.right !== undefined ? { right: dropdownPos.right } : { left: dropdownPos.left }),
                  background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.98)` : mergedStyle.backgroundColor,
                  backdropFilter: mergedStyle.glassmorphism ? "blur(20px)" : "none",
                  border: `1px solid ${mergedStyle.primaryColor}30`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  zIndex: 99999,
                  minWidth: "300px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  
                }}
              >
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${mergedStyle.primaryColor}20`, background: `linear-gradient(135deg, ${mergedStyle.primaryColor}10, transparent)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "white", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      {getTranslation('export.export_menu')}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{filteredDataCountNonFloating} {getTranslation('export.records')}</div>
                  </div>
                  <button
                    onClick={() => { setOpenMenu(false); setOpenCustomizePanel(true); }}
                    style={{ padding: "6px 12px", background: `${mergedStyle.primaryColor}20`, border: `1px solid ${mergedStyle.primaryColor}40`, borderRadius: "8px", color: mergedStyle.primaryColor, cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${mergedStyle.primaryColor}40`}
                    onMouseLeave={(e) => e.currentTarget.style.background = `${mergedStyle.primaryColor}20`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    {getTranslation('export.customize')}
                  </button>
                </div>
                {Object.entries(formatMeta).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => handleExport(key)}
                    style={{ width: "100%", padding: "12px 18px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", textAlign: "left", }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${meta.color}15`}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${meta.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "500" }}>{meta.label}</div>
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>{meta.description}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#555" }}>{filteredDataCountNonFloating} {getTranslation('export.lines')}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        , document.body)}
      </div>

      {/* Panel de personnalisation — bottom sheet sur mobile, modal centré sur desktop */}
      {openCustomizePanel && typeof document !== "undefined" && createPortal(
        <div
          ref={customizePanelRef}
          style={isMobile ? {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: mergedStyle.glassmorphism ? `rgba(22, 22, 35, 0.99)` : mergedStyle.backgroundColor,
            backdropFilter: "blur(24px)",
            borderRadius: "24px 24px 0 0",
            zIndex: 100000,
            maxHeight: "92vh",
            overflow: "hidden",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            border: `1px solid ${mergedStyle.primaryColor}30`,
            
            display: "flex",
            flexDirection: "column",
          } : {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: mergedStyle.glassmorphism ? `rgba(30, 30, 46, 0.98)` : mergedStyle.backgroundColor,
            backdropFilter: mergedStyle.glassmorphism ? "blur(20px)" : "none",
            borderRadius: "24px",
            zIndex: 100000,
            width: "520px",
            maxHeight: "85vh",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            border: `1px solid ${mergedStyle.primaryColor}30`,
            
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Mobile handle bar */}
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
            </div>
          )}

          <div style={{ 
            padding: "20px 24px", 
            borderBottom: `1px solid ${mergedStyle.primaryColor}20`,
            background: `linear-gradient(135deg, ${mergedStyle.primaryColor}10, transparent)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: "bold", color: "white", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {getTranslation('export.customize_panel')}
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px" }}>
                {filteredDataCountNonFloating} {getTranslation('export.records')}
              </div>
            </div>
            <button
              onClick={() => setOpenCustomizePanel(false)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", color: "#94a3b8", cursor: "pointer", padding: "8px 12px", }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px", padding: "16px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", flexShrink: 0, WebkitOverflowScrolling: "touch" as any }}>
            {tabsConfig.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: isMobile ? "10px 14px" : "10px 18px",
                  background: activeTab === tab.id ? mergedStyle.primaryColor : "transparent",
                  border: "none",
                  borderRadius: "12px 12px 0 0",
                  color: activeTab === tab.id ? "white" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: isMobile ? "16px" : "24px", overflowY: "auto", flex: 1 }}>
            {activeTab === "columns" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>{getTranslation('export.select_columns')}</span>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button onClick={selectAllColumns} style={{ fontSize: "12px", background: "none", border: "none", color: mergedStyle.primaryColor, cursor: "pointer", padding: "4px 8px", borderRadius: "6px", }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${mergedStyle.primaryColor}20`}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px"}}><polyline points="20 6 9 17 4 12"/></svg>{getTranslation('export.select_all_short')}</>
                    </button>
                    <button onClick={deselectAllColumns} style={{ fontSize: "12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `rgba(239,68,68,0.15)`}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{getTranslation('export.deselect_all_short')}</>
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", maxHeight: "350px", overflowY: "auto" }}>
                  {getAvailableColumns().map(col => (
                    <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#94a3b8", cursor: "pointer", padding: "8px 12px", borderRadius: "10px", }}
                    >
                      <input type="checkbox" checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} style={{ width: "18px", height: "18px", cursor: "pointer", borderRadius: "4px", accentColor: mergedStyle.primaryColor }} />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "format" && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.csv_delimiter')}</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[",", ";", "\t", "|"].map(d => (
                      <button key={d} onClick={() => setCurrentDelimiter(d)} style={{ padding: "8px 16px", background: currentDelimiter === d ? mergedStyle.primaryColor : "rgba(255,255,255,0.05)", border: currentDelimiter === d ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: "13px", cursor: "pointer", }}>
                        {d === '\t' ? getTranslation('export.tab_delimiter') : d}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.pdf_orientation')}</label>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", cursor: "pointer" }}>
                      <input type="radio" name="pdfOrientation" checked={pdfOrientation === "portrait"} onChange={() => {}} style={{ accentColor: mergedStyle.primaryColor }} /> Portrait
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", cursor: "pointer" }}>
                      <input type="radio" name="pdfOrientation" checked={pdfOrientation === "landscape"} onChange={() => {}} style={{ accentColor: mergedStyle.primaryColor }} /> Paysage
                    </label>
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.date_format_label')}</label>
                  <select value={propDateFormat} onChange={(e) => {}} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer" }}>
                    <option value="yyyy-mm-dd">{getTranslation('export.date_format_iso')}</option>
                    <option value="dd/mm/yyyy">{getTranslation('export.date_format_eu')}</option>
                    <option value="mm/dd/yyyy">{getTranslation('export.date_format_us')}</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.watermark_label')}</label>
                  <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="Ex: CONFIDENTIEL" style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px" }} />
                </div>
                
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", fontSize: "13px", color: "#94a3b8", cursor: "pointer", fontWeight: "500" }}>
                    <input type="checkbox" checked={encryption} onChange={(e) => setEncryption(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: mergedStyle.primaryColor }} />
                    Activer le chiffrement
                  </label>
                  {encryption && (
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", marginTop: "12px" }} />
                  )}
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.compression_level')}</label>
                  <input type="range" min="0" max="9" value={compressionLevel} onChange={(e) => setCompressionLevel(parseInt(e.target.value))} style={{ width: "100%", accentColor: mergedStyle.primaryColor }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "8px" }}>
                    <span>{getTranslation('export.compression_none')}</span><span>{getTranslation('export.compression_normal')}</span><span>{getTranslation('export.compression_max')}</span>
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "10px", fontWeight: "500" }}>{getTranslation('export.encoding')}</label>
                  <select value={encoding} onChange={(e) => {}} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer" }}>
                    <option value="utf-8">UTF-8</option>
                    <option value="latin1">Latin-1 (ISO-8859-1)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "12px" }}>
            <button onClick={resetSettings} style={{ flex: 1, padding: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#f87171", cursor: "pointer", fontSize: "14px", fontWeight: "500", }}>
              {getTranslation('export.reset')}
            </button>
            <button onClick={applySettings} style={{ flex: 1, padding: "12px", background: buttonGradient, border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", }}>
              {getTranslation('export.apply')}
            </button>
          </div>
        </div>
      , document.body)}

      {(openMenu || openCustomizePanel) && typeof document !== "undefined" && createPortal(
        <div
          onClick={() => {
            setOpenMenu(false);
            setOpenCustomizePanel(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99998,
            background: "rgba(0,0,0,0.5)",
            }}
        />
      , document.body)}

      <SuccessToast msg={success} />
      {exporting && <ProgressBar progress={progress} />}

      <style dangerouslySetInnerHTML={{ __html: `
        
        
        
        
        
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        

        
        /* Prevent zoom on input focus on iOS */
        @media (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }
          * { -webkit-tap-highlight-color: transparent; }
        }
      ` }} />
    </>
  );
}

function SuccessToast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: "14px",
        padding: "14px 24px",
        zIndex: 10001,
        color: "#10b981",
        fontSize: "14px",
        fontWeight: "500",
        
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {msg}
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "100px",
        right: "24px",
        width: "240px",
        background: "rgba(30, 30, 46, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 10001,
        border: "1px solid rgba(99,102,241,0.3)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "4px",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
        }}
      />
      <div style={{ padding: "12px 16px", fontSize: "13px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid rgba(99,102,241,0.3)`, borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
        Export en cours... {progress}%
      </div>
    </div>
  );
}