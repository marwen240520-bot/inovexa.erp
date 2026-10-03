"use client";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseImportFile } from "@/lib/importParsers";

interface ImportButtonProps {
  onImport: (data: any[]) => void | Promise<void>;
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
  accept = ".json,.csv,.tsv,.txt,.xlsx,.xls",
  maxSize = 10,
  allowedFormats = ["json", "csv", "tsv", "txt", "xlsx", "xls"],
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

  // Lecture du fichier : CSV (, ; tab |), Excel .xlsx, JSON, tableau HTML exporté par l'application
  const processFile = (file: File): Promise<any[]> => parseImportFile(file);

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
        await onImport(processedData);
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

  const confirmImport = async () => {
    if (importData.length === 0 || isImporting) return;
    setIsImporting(true);
    try {
      // Le résultat réel (succès / erreurs ligne par ligne) est affiché par la page appelante
      await onImport(importData);
      setShowPreview(false);
      setShowModal(false);
      setImportData([]);
      setPreviewData(null);
    } catch (err: any) {
      const msg = err?.message || "Erreur lors de l'import";
      setError(msg);
      if (onError) onError(msg);
    } finally {
      setIsImporting(false);
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
          background: "rgba(15,23,42,0.5)",
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
            background: "var(--theme-surface)",
            borderRadius: "20px",
            width: "90%",
            maxWidth: "1200px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--theme-border)",
            animation: "scaleIn 0.2s ease"
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--theme-border)",
              background: "var(--theme-surface-hover)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div>
              <h3 style={{ color: "var(--theme-text)", margin: 0, fontSize: "18px" }}>
                📋 {getTranslatedText("preview")}
              </h3>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "var(--theme-text-secondary)" }}>
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
                  <tr style={{ borderBottom: "1px solid var(--theme-border)" }}>
                    {previewData.headers.map((header, idx) => (
                      <th
                        key={idx}
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "var(--theme-text-secondary)",
                          fontWeight: "500",
                          fontSize: "13px",
                          background: "var(--theme-surface-hover)",
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
                        borderBottom: "1px solid var(--theme-surface-hover)",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-surface-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {previewData.headers.map((header, colIdx) => (
                        <td
                          key={colIdx}
                          style={{
                            padding: "12px",
                            color: "var(--theme-text-secondary)",
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
                  color: "var(--theme-text-secondary)",
                  fontSize: "12px",
                  borderTop: "1px solid var(--theme-surface-hover)",
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
              borderTop: "1px solid var(--theme-border)",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}
          >
            <button
              onClick={cancelImport}
              style={{
                padding: "10px 24px",
                background: "var(--theme-border)",
                border: "none",
                borderRadius: "8px",
                color: "var(--theme-text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-border-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-border)"}
            >
              {getTranslatedText("cancel")}
            </button>
            <button
              onClick={confirmImport}
              disabled={isImporting}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                opacity: isImporting ? 0.7 : 1,
                cursor: isImporting ? "wait" : "pointer",
                transition: "all 0.2s",
                fontWeight: "500"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              {isImporting ? `⏳ ${getTranslatedText("importing")}` : `✅ ${getTranslatedText("confirm")}`}
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
          background: "var(--theme-surface-hover)",
          border: "1px solid var(--theme-border)",
          borderRadius: iconOnly ? "8px" : "8px",
          color: "var(--theme-text)",
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
            e.currentTarget.style.background = "var(--theme-surface-hover)";
            e.currentTarget.style.borderColor = "#667eea";
          }
        }}
        onMouseLeave={(e) => {
          if (!isImporting) {
            e.currentTarget.style.background = "var(--theme-surface-hover)";
            e.currentTarget.style.borderColor = "var(--theme-border)";
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
            background: "var(--theme-surface-hover)",
            border: "1px solid #667eea",
            borderRadius: "12px",
            padding: "12px 20px",
            zIndex: 10001,
            minWidth: "250px",
            boxShadow: "0 10px 30px rgba(17,24,39,0.18)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--theme-text)", fontSize: "12px" }}>📥 Import en cours...</span>
            <span style={{ color: "#667eea", fontSize: "12px" }}>{progress}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "var(--theme-border)",
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