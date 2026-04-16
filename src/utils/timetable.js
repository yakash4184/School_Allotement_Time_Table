const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const compareText = (first, second) =>
  String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });

export const comparePeriods = (first, second) => compareText(first, second);

const normalizeClassName = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const getDayRank = (day) => {
  const index = DAY_ORDER.indexOf(String(day ?? "").trim().toLowerCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const getClassRank = (className) => {
  const normalized = normalizeClassName(className);

  if (normalized === "NURSERY") {
    return { group: 0, number: 0, suffix: "" };
  }

  if (normalized === "L.K.G" || normalized === "LKG") {
    return { group: 1, number: 0, suffix: "" };
  }

  if (normalized === "U.K.G" || normalized === "UKG") {
    return { group: 2, number: 0, suffix: "" };
  }

  const match = normalized.match(/^(\d+)([A-Z]*)$/);

  if (match) {
    return {
      group: 3,
      number: Number(match[1]),
      suffix: match[2] || "",
    };
  }

  return {
    group: 4,
    number: Number.MAX_SAFE_INTEGER,
    suffix: normalized,
  };
};

export const compareClassNames = (first, second) => {
  const firstRank = getClassRank(first);
  const secondRank = getClassRank(second);

  if (firstRank.group !== secondRank.group) {
    return firstRank.group - secondRank.group;
  }

  if (firstRank.number !== secondRank.number) {
    return firstRank.number - secondRank.number;
  }

  if (firstRank.suffix !== secondRank.suffix) {
    return compareText(firstRank.suffix, secondRank.suffix);
  }

  return compareText(first, second);
};

export const sortRows = (rows) =>
  [...rows].sort((left, right) => {
    const classDiff = compareClassNames(left.className, right.className);

    if (classDiff !== 0) {
      return classDiff;
    }

    const dayDiff = getDayRank(left.day) - getDayRank(right.day);

    if (dayDiff !== 0) {
      return dayDiff;
    }

    const periodDiff = compareText(left.period, right.period);

    if (periodDiff !== 0) {
      return periodDiff;
    }

    return compareText(left.teacher, right.teacher);
  });

export const getUniqueValues = (rows, key) =>
  [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((first, second) => {
    if (key === "className") {
      return compareClassNames(first, second);
    }

    if (key === "day") {
      return getDayRank(first) - getDayRank(second);
    }

    return compareText(first, second);
  });

export const filterRows = (rows, filters) =>
  rows.filter((row) => {
    const matchesDay = filters.day === "All Days" || row.day === filters.day;
    const matchesClass =
      filters.className === "All Classes" || row.className === filters.className;

    return matchesDay && matchesClass;
  });

export const getFreeTeachersForPeriod = (rows, currentRow, absentTeachers = []) => {
  const blockedTeachers = new Set(absentTeachers.filter(Boolean));
  const allTeachers = getUniqueValues(rows, "teacher").filter(
    (teacher) => !blockedTeachers.has(teacher),
  );

  return allTeachers.filter((teacher) => {
    const isBusy = rows.some(
      (row) =>
        row.id !== currentRow.id &&
        row.day === currentRow.day &&
        row.period === currentRow.period &&
        (row.teacher === teacher || row.substituteTeacher === teacher),
    );

    return !isBusy;
  });
};

export const getSuggestedTeacher = (rows, currentRow, absentTeachers = []) =>
  getFreeTeachersForPeriod(rows, currentRow, absentTeachers)[0] || "";

export const resolveCurrentTeacher = (row) => row.substituteTeacher || row.teacher;

export const getTeacherDaySchedule = (rows, teacher, day, excludeRowId) =>
  [...rows]
    .filter((row) => {
      if (row.id === excludeRowId || row.day !== day) {
        return false;
      }

      return row.teacher === teacher || row.substituteTeacher === teacher;
    })
    .sort((left, right) => comparePeriods(left.period, right.period));
