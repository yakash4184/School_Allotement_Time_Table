import { getFreeTeachersForPeriod, getSuggestedTeacher } from "../utils/timetable";

function AllotmentPanel({
  absentTeachers,
  periods,
  rows,
  teacherOptions,
  onAssignSubstitute,
}) {
  const absentTeacherLabel =
    absentTeachers.length === 1
      ? absentTeachers[0]
      : `${absentTeachers.length} absent teachers`;

  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Manual Allotment</h2>
          <p>
            {absentTeachers.length
              ? `${periods.length} period(s) found for ${absentTeacherLabel}.`
              : "Select one or more absent teachers to view their periods."}
          </p>
        </div>
      </div>

      {!absentTeachers.length ? (
        <div className="empty-state">No teacher selected yet.</div>
      ) : !periods.length ? (
        <div className="empty-state">No Data</div>
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Day</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Absent Teacher</th>
                <th>Suggested Free Teachers</th>
                <th>Substitute Teacher</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((row) => {
                const freeTeachers = getFreeTeachersForPeriod(rows, row, absentTeachers);
                const suggestedTeacher = getSuggestedTeacher(rows, row, absentTeachers);

                return (
                  <tr className="absent-row" key={row.id}>
                    <td>{row.className}</td>
                    <td>{row.day}</td>
                    <td>{row.period}</td>
                    <td>{row.subject}</td>
                    <td>
                      <span className="chip chip-danger">{row.teacher}</span>
                    </td>
                    <td>
                      {freeTeachers.length ? (
                        <span className="suggestion-text">
                          {freeTeachers.slice(0, 3).join(", ")}
                        </span>
                      ) : (
                        <span className="suggestion-text muted-text">No free teacher found</span>
                      )}
                    </td>
                    <td>
                      <div className="assign-control">
                        <select
                          value={row.substituteTeacher}
                          onChange={(event) =>
                            onAssignSubstitute(row.id, event.target.value)
                          }
                        >
                          <option value="">
                            {suggestedTeacher
                              ? `Choose substitute (suggested: ${suggestedTeacher})`
                              : "Choose substitute"}
                          </option>
                          {teacherOptions.map((teacher) => {
                            const isDisabled = absentTeachers.includes(teacher);
                            const isSuggested = teacher === suggestedTeacher;

                            return (
                              <option disabled={isDisabled} key={teacher} value={teacher}>
                                {teacher}
                                {isSuggested ? " (Suggested free)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {row.substituteTeacher ? (
                          <span className="chip chip-success">
                            Assigned: {row.substituteTeacher}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AllotmentPanel;
