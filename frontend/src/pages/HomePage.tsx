function HomePage() {

  const handleImportClick = () => {
    // TODO: Navigate to import page when implemented
    alert('Import collection feature coming soon!');
  };

  return (
    <div className="home-page">
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
            <path
              d="M40 50L60 30L80 50M60 30V90"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="empty-state-title">Welcome to Action Console</h2>
        <p className="empty-state-description">
          Transform your Postman collections into safe, plain-English actions that anyone can run.
        </p>
        <p className="empty-state-subtitle">
          Get started by importing your first Postman collection.
        </p>
        <div className="import-section">
          <FileUpload onFileSelect={handleFileSelect} />
          {uploadError && <div className="error-message">{uploadError}</div>}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
