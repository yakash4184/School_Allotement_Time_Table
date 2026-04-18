import { Fragment } from "react";

import {
  getFreeTeachersForPeriod,
  getSuggestedTeacher,
  getTeacherDaySchedule,
} from "../utils/timetable";

function AllotmentPanel({
  absentTeachers,
  allTeacherOptions,
  periods,
  rows,
  onAssignSubstitute,
}) {
  const absentTeacherLabel =
    absentTeachers.length === 1
      ? absentTeachers[0]
      : `${absentTeachers.length} absent teachers`;
  let currentTeacher = "";

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
                const showTeacherHeader = row.teacher !== currentTeacher;
                if (showTeacherHeader) {
                  currentTeacher = row.teacher;
                }
                const freeTeachers = getFreeTeachersForPeriod(rows, row, absentTeachers);
                const suggestedTeacher = getSuggestedTeacher(rows, row, absentTeachers);
                const allTeachers = allTeacherOptions.filter(
                  (teacher) => !absentTeachers.includes(teacher),
                );
                const selectedTeacherSchedule = row.substituteTeacher
                  ? getTeacherDaySchedule(rows, row.substituteTeacher, row.day, row.id)
                  : [];

                return (
                  <Fragment key={row.id}>
                    {showTeacherHeader ? (
                      <tr className="teacher-group-row" key={`group-${row.teacher}`}>
                        <td colSpan="7">
                          <div className="teacher-group-title">
                            <span className="chip chip-danger">{row.teacher}</span>
                            <span className="teacher-group-copy">
                              Full period-wise timetable
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : null}
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
                              Choose substitute
                            </option>
                            {freeTeachers.length ? (
                              <optgroup label="Suggested Free Teachers">
                                {freeTeachers.map((teacher) => (
                                  <option key={`suggested-${teacher}`} value={teacher}>
                                    {teacher}
                                    {teacher === suggestedTeacher ? " (Suggested)" : ""}
                                  </option>
                                ))}
                              </optgroup>
                            ) : (
                              <optgroup label="Suggested Free Teachers">
                                <option disabled value="">
                                  No free teacher found
                                </option>
                              </optgroup>
                            )}
                            {allTeachers.length ? (
                              <optgroup label="All Teachers">
                                {allTeachers.map((teacher) => (
                                  <option key={`all-${teacher}`} value={teacher}>
                                    {teacher}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                          </select>
                          {row.substituteTeacher ? (
                            <div className="assignment-summary">
                              <span className="chip chip-success">
                                Assigned: {row.substituteTeacher}
                              </span>
                              <span className="schedule-note">
                                {selectedTeacherSchedule.length
                                  ? `Existing bells on ${row.day}: ${selectedTeacherSchedule
                                      .map(
                                        (scheduleRow) =>
                                          `${scheduleRow.period} ${scheduleRow.className}`,
                                      )
                                      .join(", ")}`
                                  : `${row.substituteTeacher} has no other bell on ${row.day}.`}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
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
