function StatsCards({
  periodsLabel,
  teachersLabel,
  totalPeriods,
  totalTeachers,
  pdfDutyRows,
  pdfTeachers,
}) {
  const stats = [
    { label: periodsLabel, value: totalPeriods },
    { label: teachersLabel, value: totalTeachers },
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
