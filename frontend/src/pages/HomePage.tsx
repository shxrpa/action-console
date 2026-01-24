import { useState, useContext } from 'react';
import FileUpload from '../components/FileUpload';
import { importCollection } from '../services/api';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

function HomePage() {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const { selectedWorkspaceId } = useContext(WorkspaceContext) || { selectedWorkspaceId: null };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedWorkspaceId) {
      setUploadError('Please select a workspace first');
      return;
    }

    try {
      const result = await importCollection(file, selectedWorkspaceId);
      setUploadSuccess(`Collection "${result.name}" imported successfully! (${result.requestCount} requests)`);
      // TODO: Navigate to collection view or refresh collection list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import collection';
      setUploadError(message);
    }
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
          {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
