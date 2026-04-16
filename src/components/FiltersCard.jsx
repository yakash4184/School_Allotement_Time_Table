function FiltersCard({
  absentTeachers,
  classOptions,
  dayOptions,
  filters,
  onAbsentTeacherChange,
  onFilterChange,
  onRemoveAbsentTeacher,
  selectedAbsentTeachers,
  teacherOptions,
}) {
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Filters & Absence</h2>
          <p>Slice the timetable, then choose one or more absent teachers for that view.</p>
        </div>
      </div>

      <div className="filters-grid">
        <label>
          <span>Filter by Day</span>
          <select
            value={filters.day}
            onChange={(event) => onFilterChange("day", event.target.value)}
          >
            <option>All Days</option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Filter by Class</span>
          <select
            value={filters.className}
            onChange={(event) => onFilterChange("className", event.target.value)}
          >
            <option>All Classes</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <div className="absent-teacher-group">
          <span>Absent Teachers</span>
          <div className="absent-teacher-stack">
            {absentTeachers.map((teacher, index) => {
              const isPlaceholderRow = teacher === "";
              const label = index === 0 ? "Select teacher" : `Select teacher ${index + 1}`;

              return (
                <div className="absent-teacher-row" key={`${teacher || "empty"}-${index}`}>
                  <select
                    value={teacher}
                    onChange={(event) =>
                      onAbsentTeacherChange(index, event.target.value)
                    }
                  >
                    <option value="">{label}</option>
                    {teacherOptions.map((optionTeacher) => {
                      const isDisabled =
                        optionTeacher !== teacher &&
                        selectedAbsentTeachers.includes(optionTeacher);

                      return (
                        <option
                          disabled={isDisabled}
                          key={optionTeacher}
                          value={optionTeacher}
                        >
                          {optionTeacher}
                        </option>
                      );
                    })}
                  </select>

                  {!isPlaceholderRow ? (
                    <button
                      className="ghost-button"
                      onClick={() => onRemoveAbsentTeacher(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FiltersCard;
