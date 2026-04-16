function StatsCards({ totalPeriods, totalTeachers, filteredCount, assignedCount }) {
  const stats = [
    { label: "Total Periods", value: totalPeriods },
    { label: "Teachers", value: totalTeachers },
    { label: "Visible Rows", value: filteredCount },
    { label: "Substitutes Assigned", value: assignedCount },
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
