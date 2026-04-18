import { compareClassNames, comparePeriods } from "./timetable";

const formatFilterLabel = (filters) => ({
  day: filters.day === "All Days" ? "All Days" : filters.day,
  className: filters.className === "All Classes" ? "All Classes" : filters.className,
});

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const getDayRank = (day) => {
  const index = DAY_ORDER.indexOf(String(day ?? "").trim().toLowerCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const sortDutySlipRows = (rows) =>
  [...rows].sort((left, right) => {
    const dayDiff = getDayRank(left.day) - getDayRank(right.day);

    if (dayDiff !== 0) {
      return dayDiff;
    }

    const periodDiff = comparePeriods(left.period, right.period);

    if (periodDiff !== 0) {
      return periodDiff;
    }

    const classDiff = compareClassNames(left.className, right.className);

    if (classDiff !== 0) {
      return classDiff;
    }

    return String(left.subject ?? "").localeCompare(String(right.subject ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const groupBySubstituteTeacher = (rows) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const teacherName = row.substituteTeacher?.trim();

    if (!teacherName) {
      return;
    }

    if (!grouped.has(teacherName)) {
      grouped.set(teacherName, []);
    }

    grouped.get(teacherName).push(row);
  });

  return [...grouped.entries()].sort(([first], [second]) =>
    first.localeCompare(second, undefined, { sensitivity: "base" }),
  );
};

const drawHeader = (doc, teacherName, rows, filters) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(216, 226, 239);
  doc.setLineWidth(0.5);
  doc.roundedRect(8, 8, pageWidth - 16, 28, 6, 6, "FD");

  doc.setTextColor(24, 53, 92);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Substitute Duty Slip", pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("Teacher Allotment System", pageWidth / 2, 28, { align: "center" });

  doc.setFillColor(240, 247, 255);
  doc.roundedRect(8, 40, pageWidth - 16, 24, 5, 5, "F");

  doc.setTextColor(33, 56, 89);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(teacherName, 14, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const { day, className } = formatFilterLabel(filters);
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  doc.text(`Assigned periods: ${rows.length}`, 14, 57);
  doc.text(`Day: ${day}`, 88, 50);
  doc.text(`Class Filter: ${className}`, 88, 57);
  doc.text(`Generated: ${generatedAt}`, pageWidth - 14, 50, { align: "right" });
  doc.text("Hand this slip to the substitute teacher.", pageWidth - 14, 57, {
    align: "right",
  });
};

export const exportSubstituteDutyPdf = async (rows, filters) => {
  const assignedRows = rows.filter((row) => row.substituteTeacher);

  if (!assignedRows.length) {
    throw new Error("No assigned substitute periods found for the current filter.");
  }

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const groupedRows = groupBySubstituteTeacher(assignedRows);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a5",
  });

  groupedRows.forEach(([teacherName, teacherRows], index) => {
    if (index > 0) {
      doc.addPage("a5", "landscape");
    }

    const sortedTeacherRows = sortDutySlipRows(teacherRows);

    drawHeader(doc, teacherName, sortedTeacherRows, filters);

    autoTable(doc, {
      startY: 70,
      head: [["Day", "Period", "Class", "Subject", "Replacing"]],
      body: sortedTeacherRows.map((row) => [
        row.day,
        row.period,
        row.className,
        row.subject,
        row.teacher,
      ]),
      margin: { left: 8, right: 8 },
      theme: "grid",
      headStyles: {
        fillColor: [221, 233, 251],
        textColor: [40, 68, 102],
        fontStyle: "bold",
        lineColor: [203, 217, 237],
      },
      bodyStyles: {
        textColor: [34, 55, 84],
        lineColor: [221, 229, 241],
      },
      alternateRowStyles: {
        fillColor: [249, 251, 255],
      },
      styles: {
        font: "helvetica",
        fontSize: 9.2,
        cellPadding: 3.4,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 19, halign: "center" },
        2: { cellWidth: 22 },
        3: { cellWidth: 54 },
        4: { cellWidth: 54 },
      },
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.6);
    doc.setTextColor(94, 116, 144);
    doc.text(
      "Please follow this revised allotment for the current school session.",
      8,
      doc.internal.pageSize.getHeight() - 7,
    );
  });

  doc.save("substitute-duty-slips.pdf");
};
