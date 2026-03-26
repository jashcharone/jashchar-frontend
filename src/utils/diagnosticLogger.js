export const logFullDiagnostic = (diagnosticResult) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    result: diagnosticResult,
    url: window.location.href
  };
  
  try {
    sessionStorage.setItem('LAST_DIAGNOSTIC_REPORT', JSON.stringify(logEntry));
  } catch (e) {
    // ignore
  }

  console.log("📋 [DIAGNOSTIC REPORT SAVED]", logEntry);
};

export const exportDiagnosticReport = () => {
  try {
    const stored = sessionStorage.getItem('LAST_DIAGNOSTIC_REPORT');
    if (!stored) return JSON.stringify({ error: "No report found" });
    return stored;
  } catch (e) {
    return JSON.stringify({ error: "Export failed" });
  }
};

export const copyDiagnosticToClipboard = () => {
  const report = exportDiagnosticReport();
  navigator.clipboard.writeText(report).then(() => {
    console.log("Report copied to clipboard");
  });
};
