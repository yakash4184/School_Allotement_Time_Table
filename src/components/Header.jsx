function Header({ darkMode, onToggleDarkMode }) {
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
          <h1>Teacher Allotment System</h1>
          <p className="hero-copy">
            Upload a timetable, mark an absent teacher, assign substitutes,
            and export the updated sheet without using any backend or database.
          </p>
        </div>
      </div>

      <button className="theme-toggle" onClick={onToggleDarkMode} type="button">
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
}

export default Header;
