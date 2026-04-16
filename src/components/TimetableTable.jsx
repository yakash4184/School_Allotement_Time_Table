import { resolveCurrentTeacher } from "../utils/timetable";

function TimetableTable({ rows }) {
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Parsed Timetable</h2>
          <p>Review the uploaded schedule before or after making substitute changes.</p>
        </div>
      </div>

      {!rows.length ? (
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
                <th>Teacher</th>
                <th>Current Allocation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.substituteTeacher ? "assigned-row" : ""}
                >
                  <td>{row.className}</td>
                  <td>{row.day}</td>
                  <td>{row.period}</td>
                  <td>{row.subject}</td>
                  <td>{row.teacher}</td>
                  <td>
                    <span className={row.substituteTeacher ? "chip chip-success" : "chip"}>
                      {resolveCurrentTeacher(row)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default TimetableTable;
