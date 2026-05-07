"use client";

export function ExportButton({ onExport, type, disabled }) {
  return (
    <button
      onClick={onExport}
      disabled={disabled}
      style={{
        background: "#10b981",
        color: "white",
        padding: "8px 16px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        opacity: disabled ? 0.5 : 1
      }}
    >
      📥 Exporter {type}
    </button>
  );
}

export function ImportButton({ onImport, type, disabled }) {
  const fileInputRef = React.useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          background: "#3b82f6",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          opacity: disabled ? 0.5 : 1
        }}
      >
        📤 Importer {type}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
