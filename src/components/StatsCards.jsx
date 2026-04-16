function StatsCards({
  totalPeriods,
  totalTeachers,
  pdfDutyRows,
  pdfTeachers,
}) {
  const stats = [
    { label: "School Periods", value: totalPeriods },
    { label: "School Teachers", value: totalTeachers },
    { label: "PDF Duty Rows", value: pdfDutyRows },
    { label: "PDF Slip Teachers", value: pdfTeachers },
  ];

  return (
    <section className="stats-grid">
      {stats.map((item) => (
        <article className="stat-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default StatsCards;
