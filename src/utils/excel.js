const REQUIRED_FIELDS = ["class", "day", "period", "teacher", "subject"];
const DAY_NAMES = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const HEADER_ALIASES = {
  class: ["class", "classname", "class name", "section"],
  day: ["day", "weekday"],
  period: ["period", "lecture", "slot", "time"],
  teacher: ["teacher", "teacher name", "faculty", "staff"],
  subject: ["subject", "course", "topic"],
};

const SUBJECT_START_PHRASES = [
  "g k",
  "e v s",
  "english grammar",
  "social science",
  "home science",
  "moral education",
  "moral edu",
  "good behaviour",
  "optional class",
  "smart class",
  "book verbal",
  "math written",
  "math verbal",
  "english written",
  "english verbal",
  "english rhaymes",
  "english rhymes",
  "hindi written",
  "hindi verbal",
  "hindi vyakaran",
  "art craft",
  "art/craft",
  "colour name",
  "colour's name",
  "counting number verbal",
  "basic hindi",
];

const SUBJECT_START_TOKENS = new Set([
  "english",
  "hindi",
  "physics",
  "chemistry",
  "math",
  "science",
  "scienec",
  "bio",
  "biology",
  "art",
  "craft",
  "computer",
  "civics",
  "economics",
  "home",
  "moral",
  "sst",
  "history",
  "geography",
  "sociology",
  "education",
  "sanskrit",
  "g k",
  "evs",
  "e v s",
  "game",
  "grammar",
  "vyakaran",
  "rhymes",
  "rhaymes",
  "verbal",
  "written",
  "behaviour",
  "counting",
  "smart",
  "good",
  "optional",
  "book",
  "social",
  "general",
]);

const IGNORED_CELL_PATTERNS = [/^$/, /^\*+$/, /^l\s*u\s*n\s*c\s*h$/i];

const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHeader = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ");

const normalizeKey = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeSubjectKey = (value) =>
  normalizeKey(value).replace(/\b(class|subject)\b/g, "").replace(/\s+/g, " ").trim();

const isMeaningfulCell = (value) =>
  !IGNORED_CELL_PATTERNS.some((pattern) => pattern.test(normalizeWhitespace(value)));

const prettifyValue = (value) =>
  normalizeWhitespace(value)
    .split(" ")
    .map((word) => {
      if (word.toUpperCase() === word && word.length <= 4) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

const cleanSubject = (value) =>
  normalizeWhitespace(value)
    .replace(/^\((.*)\)$/, "$1")
    .replace(/\s*\/\s*/g, " / ")
    .trim();

const getMappedValue = (row, field) => {
  const aliases = HEADER_ALIASES[field];
  const entry = Object.entries(row).find(([key]) =>
    aliases.includes(normalizeHeader(key)),
  );

  return entry ? normalizeWhitespace(entry[1]) : "";
};

const isEmptyRecord = (record) =>
  REQUIRED_FIELDS.every((field) => normalizeWhitespace(record[field]) === "");

const extractClassNameFromTitle = (text, fallback) => {
  const normalized = normalizeWhitespace(text);
  const match = normalized.match(/time\s*table\s*class\s*-\s*(.+?)(?:\(|$)/i);

  if (!match) {
    return fallback;
  }

  return normalizeWhitespace(match[1]) || fallback;
};

const extractTeacherFromTitle = (text) => {
  const match = normalizeWhitespace(text).match(/\(([^)]+)\)/);

  if (!match) {
    return "";
  }

  return prettifyValue(
    match[1].replace(/\b(?:mr|mrs|ms|miss|smt)\.?\b/gi, "").replace(/\s+/g, " "),
  );
};

const looksLikeGridHeader = (row) => {
  const firstCell = normalizeHeader(row?.[0]);

  if (firstCell !== "day") {
    return false;
  }

  return row.some((cell) => /^p\d+$/i.test(normalizeWhitespace(cell)));
};

const looksLikeDayRow = (row) => DAY_NAMES.has(normalizeHeader(row?.[0]));

const findSubjectBoundaryIndex = (words) => {
  for (let index = 1; index < words.length; index += 1) {
    const subjectText = normalizeSubjectKey(words.slice(index).join(" "));
    const firstSubjectWord = normalizeSubjectKey(words[index]);

    if (
      subjectText.startsWith("(") ||
      SUBJECT_START_PHRASES.some((phrase) => subjectText.startsWith(phrase)) ||
      SUBJECT_START_TOKENS.has(firstSubjectWord)
    ) {
      return index;
    }
  }

  return -1;
};

const guessTeacherName = (cellText) => {
  const normalized = normalizeWhitespace(cellText);

  if (!isMeaningfulCell(normalized) || DAY_NAMES.has(normalizeHeader(normalized))) {
    return "";
  }

  const parentheticalMatches = [
    ...normalized.matchAll(/([A-Za-z.'-]+(?:\s+[A-Za-z.'-]+){1,2})\s*\([^)]*\)/g),
  ];

  if (parentheticalMatches.length > 1) {
    return "";
  }

  const words = normalized.split(" ");
  const boundaryIndex = findSubjectBoundaryIndex(words);

  if (boundaryIndex >= 1) {
    return prettifyValue(words.slice(0, boundaryIndex).join(" "));
  }

  return "";
};

const buildTeacherDirectory = (workbook, XLSX) => {
  const teacherDirectory = new Map();

  const addTeacher = (teacherName) => {
    const normalizedTeacher = normalizeKey(teacherName);

    if (!normalizedTeacher) {
      return;
    }

    if (!teacherDirectory.has(normalizedTeacher)) {
      teacherDirectory.set(normalizedTeacher, prettifyValue(teacherName));
    }
  };

  workbook.SheetNames.forEach((sheetName) => {
    const matrixRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });

    matrixRows.forEach((row) => {
      const firstCell = normalizeWhitespace(row[0]);

      if (/time\s*table\s*class/i.test(firstCell)) {
        addTeacher(extractTeacherFromTitle(firstCell));
      }

      row.forEach((cell) => {
        const text = normalizeWhitespace(cell);

        if (!isMeaningfulCell(text) || /^p\d+$/i.test(text) || looksLikeGridHeader([text])) {
          return;
        }

        const guessedTeacher = guessTeacherName(text);

        if (guessedTeacher) {
          addTeacher(guessedTeacher);
        }

        const multiTeacherMatches = [
          ...text.matchAll(/([A-Za-z.'-]+(?:\s+[A-Za-z.'-]+){1,2})\s*\(([^)]*)\)/g),
        ];

        multiTeacherMatches.forEach((match) => addTeacher(match[1]));
      });
    });
  });

  return teacherDirectory;
};

const resolveTeacherName = (teacherName, teacherDirectory) =>
  teacherDirectory.get(normalizeKey(teacherName)) || prettifyValue(teacherName);

const parseSingleAssignment = (cellText, teacherDirectory) => {
  const normalizedText = normalizeWhitespace(cellText);
  const teacherNames = [...teacherDirectory.values()].sort(
    (left, right) => right.length - left.length,
  );

  const matchedTeacher = teacherNames.find((teacherName) =>
    normalizeKey(normalizedText).startsWith(normalizeKey(teacherName)),
  );

  if (matchedTeacher) {
    const subjectText = cleanSubject(normalizedText.slice(matchedTeacher.length));

    return {
      teacher: matchedTeacher,
      subject: subjectText || "General",
    };
  }

  const words = normalizedText.split(" ");
  const boundaryIndex = findSubjectBoundaryIndex(words);

  if (boundaryIndex >= 1) {
    return {
      teacher: resolveTeacherName(words.slice(0, boundaryIndex).join(" "), teacherDirectory),
      subject: cleanSubject(words.slice(boundaryIndex).join(" ")) || "General",
    };
  }

  if (words.length >= 2) {
    return {
      teacher: prettifyValue(words.slice(0, 2).join(" ")),
      subject: cleanSubject(words.slice(2).join(" ")) || "General",
    };
  }

  return {
    teacher: resolveTeacherName(normalizedText, teacherDirectory),
    subject: "General",
  };
};

const parseAssignmentCell = (cellText, teacherDirectory) => {
  const normalizedText = normalizeWhitespace(cellText);

  if (!isMeaningfulCell(normalizedText)) {
    return [];
  }

  const multiTeacherMatches = [
    ...normalizedText.matchAll(/([A-Za-z.'-]+(?:\s+[A-Za-z.'-]+){1,2})\s*\(([^)]*)\)/g),
  ];

  if (multiTeacherMatches.length > 1) {
    return multiTeacherMatches.map((match) => ({
      teacher: resolveTeacherName(match[1], teacherDirectory),
      subject: cleanSubject(match[2]) || "General",
    }));
  }

  return [parseSingleAssignment(normalizedText, teacherDirectory)];
};

const parseFlatRows = (rawRows) => {
  const rows = rawRows
    .map((row, index) => ({
      id: `flat-${Date.now()}-${index}`,
      className: getMappedValue(row, "class"),
      day: getMappedValue(row, "day"),
      period: getMappedValue(row, "period"),
      teacher: getMappedValue(row, "teacher"),
      subject: getMappedValue(row, "subject"),
      substituteTeacher: "",
      notes: "",
    }))
    .filter(
      (row) =>
        !isEmptyRecord({
          class: row.className,
          day: row.day,
          period: row.period,
          teacher: row.teacher,
          subject: row.subject,
        }),
    );

  const hasAllFields = rows.every((row) =>
    REQUIRED_FIELDS.every((field) => {
      const value = field === "class" ? row.className : row[field];
      return normalizeWhitespace(value) !== "";
    }),
  );

  return hasAllFields ? rows : [];
};

const parseGridWorkbook = (workbook, XLSX) => {
  const teacherDirectory = buildTeacherDirectory(workbook, XLSX);
  const parsedRows = [];
  let generatedId = 0;
  let carryForwardClassName = "";

  workbook.SheetNames.forEach((sheetName) => {
    const matrixRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });

    const titleRowIndexes = matrixRows
      .map((row, index) =>
        /time\s*table\s*class/i.test(normalizeWhitespace(row[0])) ? index : -1,
      )
      .filter((index) => index !== -1);

    const headerRowIndexes = matrixRows
      .map((row, index) => (looksLikeGridHeader(row) ? index : -1))
      .filter((index) => index !== -1);

    headerRowIndexes.forEach((headerIndex) => {
      const previousTitleIndex = [...titleRowIndexes]
        .reverse()
        .find((index) => index < headerIndex);
      const className = previousTitleIndex !== undefined
        ? extractClassNameFromTitle(matrixRows[previousTitleIndex][0], sheetName)
        : carryForwardClassName || sheetName;

      const periodColumns = matrixRows[headerIndex]
        .map((cell, index) => ({
          header: normalizeWhitespace(cell),
          index,
        }))
        .filter(({ header, index }) => index > 0 && /^p\d+$/i.test(header))
        .map(({ header, index }) => ({
          index,
          period: header.toUpperCase(),
        }));

      let rowIndex = headerIndex + 1;

      while (rowIndex < matrixRows.length) {
        const currentRow = matrixRows[rowIndex];
        const firstCell = normalizeWhitespace(currentRow[0]);

        if (rowIndex !== headerIndex + 1 && looksLikeGridHeader(currentRow)) {
          break;
        }

        if (/time\s*table\s*class/i.test(firstCell) && rowIndex !== headerIndex + 1) {
          break;
        }

        if (!looksLikeDayRow(currentRow)) {
          rowIndex += 1;
          continue;
        }

        periodColumns.forEach(({ index, period }) => {
          const assignments = parseAssignmentCell(currentRow[index], teacherDirectory);

          assignments.forEach((assignment) => {
            if (!normalizeWhitespace(assignment.teacher)) {
              return;
            }

            parsedRows.push({
              id: `grid-${generatedId}`,
              className,
              day: prettifyValue(firstCell),
              period,
              teacher: assignment.teacher,
              subject: assignment.subject,
              substituteTeacher: "",
              notes: "",
            });

            generatedId += 1;
          });
        });

        rowIndex += 1;
      }
    });

    const trailingTitleIndex = [...titleRowIndexes]
      .reverse()
      .find(
        (titleIndex) => !headerRowIndexes.some((headerIndex) => headerIndex > titleIndex),
      );

    if (trailingTitleIndex !== undefined) {
      carryForwardClassName = extractClassNameFromTitle(
        matrixRows[trailingTitleIndex][0],
        carryForwardClassName || sheetName,
      );
    }
  });

  return parsedRows.filter(
    (row) =>
      normalizeWhitespace(row.className) &&
      normalizeWhitespace(row.day) &&
      normalizeWhitespace(row.period) &&
      normalizeWhitespace(row.teacher) &&
      normalizeWhitespace(row.subject),
  );
};

export const parseTimetableFile = async (file) => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.length) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const flatCandidateRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  const flatRows = flatCandidateRows.length ? parseFlatRows(flatCandidateRows) : [];

  if (flatRows.length) {
    return flatRows;
  }

  const gridRows = parseGridWorkbook(workbook, XLSX);

  if (!gridRows.length) {
    throw new Error(
      "Unable to read this workbook. Please upload either a flat timetable sheet or the school grid timetable format.",
    );
  }

  return gridRows;
};

export const exportTimetable = async (rows) => {
  const XLSX = await import("xlsx");
  const exportRows = rows.map((row) => ({
    Class: row.className,
    Day: row.day,
    Period: row.period,
    Subject: row.subject,
    Teacher: row.substituteTeacher || row.teacher,
    "Original Teacher": row.teacher,
    "Substitute Teacher": row.substituteTeacher || "",
    Status: row.substituteTeacher ? "Substitute Assigned" : "Original Schedule",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Updated Timetable");
  XLSX.writeFile(workbook, "updated_timetable.xlsx");
};

export const exportAssignedAllotments = async (rows) => {
  const XLSX = await import("xlsx");
  const exportRows = rows
    .filter((row) => row.substituteTeacher)
    .map((row) => ({
      Class: row.className,
      Day: row.day,
      Period: row.period,
      Subject: row.subject,
      "Absent Teacher": row.teacher,
      "Substitute Teacher": row.substituteTeacher,
      "Final Allocation": row.substituteTeacher,
    }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Assigned Allotments");
  XLSX.writeFile(workbook, "assigned_allotments.xlsx");
};
