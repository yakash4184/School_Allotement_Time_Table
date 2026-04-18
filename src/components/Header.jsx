import { useEffect, useState } from "react";

function Header({ darkMode, onToggleDarkMode }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="hero-card">
      <div className="hero-brand">
        <img
          alt="Savitri Balika Inter College logo"
          className="hero-logo"
          src="/school-logo.png"
        />

        <div>
          <p className="eyebrow">Savitri Balika Inter College, Mirzapur</p>
          <h1 className="hero-title">
            <span className="hero-title-accent">Teacher Allotment System</span>
          </h1>
          <p className="hero-copy">
            Upload a timetable, mark an absent teacher, assign substitutes,
            and export the updated sheet without using any backend or database.
          </p>
        </div>
      </div>

      <div className="hero-side-panel">
        <section className="clock-card" aria-label="Current date and time">
          <span className="clock-label">Live Date & Time</span>
          <strong>{formattedTime}</strong>
          <span className="clock-date">{formattedDate}</span>
        </section>

        <button
          className={`theme-toggle ${darkMode ? "theme-toggle-dark" : "theme-toggle-light"}`}
          onClick={onToggleDarkMode}
          type="button"
        >
          <span className="theme-toggle-label">Color Mode</span>
          <strong>{darkMode ? "Light Mode" : "Dark Mode"}</strong>
        </button>
      </div>
    </header>
  );
}

export default Header;
