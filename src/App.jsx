import { useEffect, useMemo, useState } from "react";
import AllotmentPanel from "./components/AllotmentPanel";
import ExportCard from "./components/ExportCard";
import FileUploadCard from "./components/FileUploadCard";
import FiltersCard from "./components/FiltersCard";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import TimetableTable from "./components/TimetableTable";
import { exportAssignedAllotments, exportTimetable } from "./utils/excel";
import { exportSubstituteDutyPdf } from "./utils/pdf";
import { filterRows, getUniqueValues, sortRows } from "./utils/timetable";

const areArraysEqual = (first, second) =>
  first.length === second.length &&
  first.every((value, index) => value === second[index]);

const buildAbsentTeacherSelections = (values, teacherOptions) => {
  const normalizedSelections = [];

  values.forEach((value) => {
    if (
      value &&
      teacherOptions.includes(value) &&
      !normalizedSelections.includes(value)
    ) {
      normalizedSelections.push(value);
    }
  });

  if (normalizedSelections.length < teacherOptions.length) {
    normalizedSelections.push("");
  }

  return normalizedSelections.length ? normalizedSelections : [""];
};

function App() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    day: "All Days",
    className: "All Classes",
  });
  const [absentTeachers, setAbsentTeachers] = useState([""]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const dayOptions = useMemo(() => getUniqueValues(rows, "day"), [rows]);
  const classOptions = useMemo(() => getUniqueValues(rows, "className"), [rows]);

  const filteredRows = useMemo(
    () => sortRows(filterRows(rows, filters)),
    [filters, rows],
  );

  const schoolTeacherOptions = useMemo(
    () => getUniqueValues(rows, "teacher"),
    [rows],
  );

  const teacherOptions = useMemo(
    () => getUniqueValues(filteredRows, "teacher"),
    [filteredRows],
  );

  const selectedAbsentTeachers = useMemo(
    () => absentTeachers.filter(Boolean),
    [absentTeachers],
  );

  const absentTeacherPeriods = useMemo(
    () =>
      sortRows(
        filteredRows.filter((row) => selectedAbsentTeachers.includes(row.teacher)),
      ),
    [filteredRows, selectedAbsentTeachers],
  );

  const assignedCount = useMemo(
    () => rows.filter((row) => row.substituteTeacher).length,
    [rows],
  );

  const assignedRows = useMemo(
    () => sortRows(rows.filter((row) => row.substituteTeacher)),
    [rows],
  );

  const assignedFilteredRows = useMemo(
    () => sortRows(filteredRows.filter((row) => row.substituteTeacher)),
    [filteredRows],
  );

  const pdfTeacherCount = useMemo(
    () => new Set(assignedFilteredRows.map((row) => row.substituteTeacher)).size,
    [assignedFilteredRows],
  );

  useEffect(() => {
    setAbsentTeachers((currentSelections) => {
      const nextSelections = buildAbsentTeacherSelections(
        currentSelections,
        teacherOptions,
      );

      return areArraysEqual(currentSelections, nextSelections)
        ? currentSelections
        : nextSelections;
    });
  }, [teacherOptions]);

  const handleDataParsed = (parsedRows, sourceFileName) => {
    setRows(parsedRows);
    setFileName(sourceFileName);
    setError("");
    setAbsentTeachers([""]);
    setFilters({
      day: "All Days",
      className: "All Classes",
    });
  };

  const handleAssignSubstitute = (rowId, substituteTeacher) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              substituteTeacher,
            }
          : row,
      ),
    );
  };

  const handleAbsentTeacherChange = (index, teacherName) => {
    setAbsentTeachers((currentSelections) => {
      const nextSelections = [...currentSelections];
      nextSelections[index] = teacherName;

      return buildAbsentTeacherSelections(nextSelections, teacherOptions);
    });
  };

  const handleRemoveAbsentTeacher = (index) => {
    const removedTeacher = absentTeachers[index];

    if (!removedTeacher) {
      setAbsentTeachers((currentSelections) =>
        buildAbsentTeacherSelections(
          currentSelections.filter((_, currentIndex) => currentIndex !== index),
          teacherOptions,
        ),
      );
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) => {
        const matchesDay = filters.day === "All Days" || row.day === filters.day;
        const matchesClass =
          filters.className === "All Classes" || row.className === filters.className;

        if (
          row.teacher === removedTeacher &&
          row.substituteTeacher &&
          matchesDay &&
          matchesClass
        ) {
          return {
            ...row,
            substituteTeacher: "",
          };
        }

        return row;
      }),
    );

    setAbsentTeachers((currentSelections) =>
      buildAbsentTeacherSelections(
        currentSelections.filter((_, currentIndex) => currentIndex !== index),
        teacherOptions,
      ),
    );
  };

  const handleExport = async () => {
    if (!rows.length) {
      return;
    }

    try {
      await exportTimetable(sortRows(rows));
      setError("");
    } catch (exportError) {
      setError(exportError.message || "Unable to export the timetable.");
    }
  };

  const handleExportAssignedOnly = async () => {
    if (!assignedRows.length) {
      return;
    }

    try {
      await exportAssignedAllotments(assignedRows);
      setError("");
    } catch (exportError) {
      setError(exportError.message || "Unable to export assigned allotments.");
    }
  };

  const handleExportSubstitutePdf = async () => {
    if (!assignedFilteredRows.length) {
      return;
    }

    try {
      await exportSubstituteDutyPdf(assignedFilteredRows, filters);
      setError("");
    } catch (exportError) {
      setError(exportError.message || "Unable to export substitute duty PDF.");
    }
  };

  return (
    <div className="app-shell">
      <div className="page-gradient" />
      <main className="app-container">
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((currentValue) => !currentValue)}
        />

        <StatsCards
          pdfDutyRows={assignedFilteredRows.length}
          pdfTeachers={pdfTeacherCount}
          totalPeriods={rows.length}
          totalTeachers={schoolTeacherOptions.length}
        />

        {error ? <div className="alert-banner">{error}</div> : null}

        <section className="top-grid">
          <FileUploadCard
            fileName={fileName}
            onDataParsed={handleDataParsed}
            onError={setError}
          />

          <ExportCard
            disabled={!rows.length}
            disabledAssigned={!assignedRows.length}
            disabledPdf={!assignedFilteredRows.length}
            fileName={fileName}
            onExport={handleExport}
            onExportAssigned={handleExportAssignedOnly}
            onExportPdf={handleExportSubstitutePdf}
          />
        </section>

        <FiltersCard
          absentTeachers={absentTeachers}
          classOptions={classOptions}
          dayOptions={dayOptions}
          filters={filters}
          onAbsentTeacherChange={handleAbsentTeacherChange}
          onFilterChange={(key, value) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              [key]: value,
            }))
          }
          onRemoveAbsentTeacher={handleRemoveAbsentTeacher}
          selectedAbsentTeachers={selectedAbsentTeachers}
          teacherOptions={teacherOptions}
        />

        <AllotmentPanel
          absentTeachers={selectedAbsentTeachers}
          allTeacherOptions={schoolTeacherOptions}
          onAssignSubstitute={handleAssignSubstitute}
          periods={absentTeacherPeriods}
          rows={rows}
        />

        <TimetableTable rows={filteredRows} />
      </main>
    </div>
  );
}

export default App;
