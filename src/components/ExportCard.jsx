function ExportCard({
  disabled,
  disabledAssigned,
  disabledPdf,
  fileName,
  onExport,
  onExportAssigned,
  onExportPdf,
}) {
  return (
    <section className="card export-card">
      <div>
        <h2>Export Updated Timetable</h2>
        <p>
          Download the full timetable, only the assigned rows, or a printable
          substitute-duty PDF slip based on the current filters.
        </p>
        {fileName ? <span className="muted-text">Source file: {fileName}</span> : null}
      </div>

      <div className="export-actions">
        <button
          className="secondary-button"
          disabled={disabledPdf}
          onClick={onExportPdf}
          type="button"
        >
          Export Duty PDF
        </button>
        <button
          className="secondary-button"
          disabled={disabledAssigned}
          onClick={onExportAssigned}
          type="button"
        >
          Export Assigned Only
        </button>
        <button className="primary-button" disabled={disabled} onClick={onExport} type="button">
          Export Full Excel
        </button>
      </div>
    </section>
  );
}

export default ExportCard;
