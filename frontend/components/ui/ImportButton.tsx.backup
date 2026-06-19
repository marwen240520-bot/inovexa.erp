"use client";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImportButtonProps {
  onImport: (data: any[]) => void;
  onError?: (error: string) => void;
  label?: string | React.ReactNode;
  accept?: string;
  maxSize?: number;
  allowedFormats?: string[];
  mapping?: Record<string, string>;
  preview?: boolean;
  onValidate?: (data: any[]) => { valid: boolean; errors: string[] };
  iconOnly?: boolean;
}

interface PreviewData {
  headers: string[];
  rows: any[];
  totalRows: number;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export default function ImportButton({ 
  onImport, 
  onError,
  label, 
  accept = ".json,.csv,.xlsx,.xls",
  maxSize = 10,
  allowedFormats = ["json", "csv", "xlsx", "xls"],
  mapping = {},
  preview = true,
  onValidate,
  iconOnly = false
}: ImportButtonProps) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const parseCSV = (content: string, delimiter: string = ","): any[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = parseCSVLine(lines[0], delimiter);
    const result: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      if (values.length === headers.length) {
        const obj: any = {};
        headers.forEach((header, idx) => {
          let value = values[idx]?.trim();
          if (value && !isNaN(Number(value)) && value !== "") {
            obj[header.trim()] = Number(value);
          } else if (value === "true" || value === "false") {
            obj[header.trim()] = value === "true";
          } else {
            obj[header.trim()] = value || "";
          }
        });
        result.push(obj);
      }
    }
    return result;
  };

  const parseCSVLine = (line: string, delimiter: string = ","): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, ""));
  };

  const parseJSON = (content: string): any[] => {
    const data = JSON.parse(content);
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null) return [data];
    throw new Error("Le fichier JSON doit contenir un tableau ou un objet");
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = parseCSV(content);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  };

  const processFile = async (file: File): Promise<any[]> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || "";
    const content = await readFileContent(file);
    
    switch (fileExtension) {
      case "json":
        return parseJSON(content);
      case "csv":
        return parseCSV(content);
      case "xlsx":
      case "xls":
        return await parseExcel(file);
      default:
        throw new Error(`Format non supporté: ${fileExtension}`);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file, "UTF-8");
    });
  };

  const applyMapping = (data: any[]): any[] => {
    if (Object.keys(selectedColumns).length === 0) return data;
    return data.map(row => {
      const newRow: any = {};
      Object.entries(selectedColumns).forEach(([originalKey, newKey]) => {
        if (newKey && row[originalKey] !== undefined) {
          newRow[newKey] = row[originalKey];
        } else if (row[originalKey] !== undefined) {
          newRow[originalKey] = row[originalKey];
        }
      });
      return { ...newRow, ...row };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    setProgress(0);
    
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `Le fichier dépasse la taille maximale de ${maxSize} MB`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      e.target.value = '';
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || "";
    if (!allowedFormats.includes(fileExtension)) {
      const errorMsg = `Format non supporté. Formats acceptés: ${allowedFormats.join(", ")}`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      e.target.value = '';
      return;
    }
    
    setIsImporting(true);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);
    
    try {
      const data = await processFile(file);
      clearInterval(progressInterval);
      setProgress(100);
      
      if (data.length === 0) {
        const errorMsg = "Le fichier ne contient aucune donnée";
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }
      
      let processedData = applyMapping(data);
      
      if (onValidate) {
        const validation = onValidate(processedData);
        if (!validation.valid) {
          setValidationErrors(validation.errors);
          if (onError) onError(validation.errors.join(", "));
          return;
        }
      }
      
      if (preview && processedData.length > 0) {
        const headers = Object.keys(processedData[0]);
        setPreviewData({
          headers,
          rows: processedData.slice(0, 10),
          totalRows: processedData.length,
          fileName: file.name,
          fileSize: file.size,
          fileType: fileExtension.toUpperCase()
        });
        setImportData(processedData);
        setShowPreview(true);
        setShowModal(true);
      } else {
        onImport(processedData);
        setSuccess(`${data.length} enregistrement(s) importé(s) avec succès`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      const errorMsg = error.message || "Erreur lors de l'import du fichier";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      console.error("Erreur import:", error);
    } finally {
      setIsImporting(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const confirmImport = () => {
    if (importData.length > 0) {
      onImport(importData);
      setSuccess(`${importData.length} enregistrement(s) importé(s) avec succès`);
      setShowPreview(false);
      setShowModal(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const cancelImport = () => {
    setShowPreview(false);
    setShowModal(false);
    setImportData([]);
    setPreviewData(null);
  };

  const getTranslatedText = (key: string): string => {
    const texts: Record<string, Record<string, string>> = {
      import: { fr: "Importer", en: "Import", es: "Importar" },
      importing: { fr: "Import en cours...", en: "Importing...", es: "Importando..." },
      preview: { fr: "Aperçu des données", en: "Data Preview", es: "Vista previa" },
      confirm: { fr: "Confirmer l'import", en: "Confirm Import", es: "Confirmar importación" },
      cancel: { fr: "Annuler", en: "Cancel", es: "Cancelar" },
      totalRows: { fr: "Total lignes", en: "Total rows", es: "Total filas" },
      fileName: { fr: "Nom du fichier", en: "File name", es: "Nombre del archivo" },
      fileSize: { fr: "Taille", en: "Size", es: "Tamaño" },
      fileType: { fr: "Type", en: "Type", es: "Tipo" }
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  const PreviewModal = () => {
    if (!showPreview || !previewData || !mounted) return null;
    
    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          animation: "fadeIn 0.2s ease"
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) cancelImport();
        }}
      >
        <div
          style={{
            background: "#111",
            borderRadius: "20px",
            width: "90%",
            maxWidth: "1200px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #333",
            animation: "scaleIn 0.2s ease"
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #222",
              background: "#1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div>
              <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>
                📋 {getTranslatedText("preview")}
              </h3>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#666" }}>
                <span>📄 {previewData.fileName}</span>
                <span>📊 {previewData.totalRows} {getTranslatedText("totalRows")}</span>
                <span>💾 {formatFileSize(previewData.fileSize)}</span>
                <span>🏷️ {previewData.fileType}</span>
              </div>
            </div>
            <button
              onClick={cancelImport}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#f87171",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
            >
              ✕ {getTranslatedText("cancel")}
            </button>
          </div>

          <div style={{ overflow: "auto", flex: 1, padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222" }}>
                    {previewData.headers.map((header, idx) => (
                      <th
                        key={idx}
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#94a3b8",
                          fontWeight: "500",
                          fontSize: "13px",
                          background: "#1a1a1a",
                          position: "sticky",
                          top: 0
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{
                        borderBottom: "1px solid #1a1a1a",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {previewData.headers.map((header, colIdx) => (
                        <td
                          key={colIdx}
                          style={{
                            padding: "12px",
                            color: "#94a3b8",
                            fontSize: "13px",
                            maxWidth: "250px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={String(row[header] || "")}
                        >
                          {String(row[header] || "-").substring(0, 50)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.totalRows > 10 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: "#666",
                  fontSize: "12px",
                  borderTop: "1px solid #1a1a1a",
                  marginTop: "16px"
                }}
              >
                + {previewData.totalRows - 10} lignes supplémentaires
              </div>
            )}
          </div>

          {validationErrors.length > 0 && (
            <div
              style={{
                margin: "0 20px 20px 20px",
                padding: "12px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px"
              }}
            >
              <div style={{ color: "#f87171", fontSize: "12px", marginBottom: "8px" }}>
                ⚠️ Erreurs de validation:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#f87171", fontSize: "11px" }}>
                {validationErrors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li>... et {validationErrors.length - 5} autres erreurs</li>
                )}
              </ul>
            </div>
          )}

          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid #222",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}
          >
            <button
              onClick={cancelImport}
              style={{
                padding: "10px 24px",
                background: "#333",
                border: "none",
                borderRadius: "8px",
                color: "#94a3b8",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#444"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#333"}
            >
              {getTranslatedText("cancel")}
            </button>
            <button
              onClick={confirmImport}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: "500"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              ✅ {getTranslatedText("confirm")}
            </button>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        ` }} />
      </div>,
      document.body
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: "none" }}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        style={{
          padding: iconOnly ? "8px" : "10px 20px",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: iconOnly ? "8px" : "8px",
          color: "white",
          cursor: isImporting ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: iconOnly ? "0" : "8px",
          fontSize: "14px",
          transition: "all 0.2s",
          opacity: isImporting ? 0.7 : 1,
          minWidth: iconOnly ? "40px" : "auto",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          if (!isImporting) {
            e.currentTarget.style.background = "#2a2a2a";
            e.currentTarget.style.borderColor = "#667eea";
          }
        }}
        onMouseLeave={(e) => {
          if (!isImporting) {
            e.currentTarget.style.background = "#1a1a1a";
            e.currentTarget.style.borderColor = "#333";
          }
        }}
      >
        {isImporting ? (
          <>
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            {!iconOnly && <span>{getTranslatedText("importing")}</span>}
          </>
        ) : (
          // Utiliser le label personnalisé s'il existe, sinon l'icône par défaut + texte
          label ? (
            label
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0, marginRight: iconOnly ? 0 : 0}}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {!iconOnly && getTranslatedText("import")}
            </>
          )
        )}
      </button>
      
      {isImporting && progress > 0 && progress < 100 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#1a1a1a",
            border: "1px solid #667eea",
            borderRadius: "12px",
            padding: "12px 20px",
            zIndex: 10001,
            minWidth: "250px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "white", fontSize: "12px" }}>📥 Import en cours...</span>
            <span style={{ color: "#667eea", fontSize: "12px" }}>{progress}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "#333",
              borderRadius: "2px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #667eea, #764ba2)",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>
      )}
      
      {success && !showPreview && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid #10b981",
            borderRadius: "12px",
            padding: "12px 20px",
            zIndex: 10001,
            color: "#10b981",
            fontSize: "13px",
            animation: "fadeIn 0.2s ease"
          }}
        >
          ✅ {success}
        </div>
      )}
      
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            padding: "12px 20px",
            zIndex: 10001,
            color: "#f87171",
            fontSize: "13px",
            animation: "fadeIn 0.2s ease"
          }}
        >
          ❌ {error}
        </div>
      )}
      
      <PreviewModal />
    </>
  );
}