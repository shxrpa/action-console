import { useContext } from 'react';
import WorkspaceSelector from './WorkspaceSelector';
import { EnvironmentSelector } from './EnvironmentSelector';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

function Header() {
  const context = useContext(WorkspaceContext);
  const selectedWorkspaceId = context?.selectedWorkspaceId || null;
  const setSelectedWorkspaceId = context?.setSelectedWorkspaceId || (() => {});

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Action Console</h1>
        <div className="header-actions">
          <WorkspaceSelector
            selectedWorkspaceId={selectedWorkspaceId}
            onWorkspaceSelect={setSelectedWorkspaceId}
          />
          <EnvironmentSelector />
        </div>
      </div>
    </header>
  );
}

export default Header;
