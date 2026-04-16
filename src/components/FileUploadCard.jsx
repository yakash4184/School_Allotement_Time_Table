import { useRef, useState } from "react";
import { parseTimetableFile } from "../utils/excel";

function FileUploadCard({ fileName, onDataParsed, onError }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file) => {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      onError("Please upload an .xlsx Excel file.");
      return;
    }

    setIsLoading(true);

    try {
      const parsedRows = await parseTimetableFile(file);
      onDataParsed(parsedRows, file.name);
    } catch (error) {
      onError(error.message || "Unable to parse the uploaded file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (event) => {
    const [file] = event.target.files || [];
    await processFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer.files || [];
    await processFile(file);
  };

  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Upload Timetable</h2>
          <p>
            Supports both flat timetable sheets and school timetable grids like
            your class-wise Excel workbook.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Browse Excel
        </button>
      </div>

      <label
        className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept=".xlsx"
          hidden
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />
        <strong>{isLoading ? "Parsing Excel in browser..." : "Drop .xlsx file here"}</strong>
        <span>
          {fileName
            ? `Loaded file: ${fileName}`
            : "Or click Browse Excel to load a timetable offline."}
        </span>
      </label>
    </section>
  );
}

export default FileUploadCard;
