import { useState } from 'react';
import WorkspaceSelector from './WorkspaceSelector';

function Header() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Action Console</h1>
        <WorkspaceSelector
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceSelect={setSelectedWorkspaceId}
        />
      </div>
    </header>
  );
}

export default Header;
