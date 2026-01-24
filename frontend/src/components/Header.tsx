import { useContext } from 'react';
import WorkspaceSelector from './WorkspaceSelector';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

function Header() {
  const context = useContext(WorkspaceContext);
  const selectedWorkspaceId = context?.selectedWorkspaceId || null;
  const setSelectedWorkspaceId = context?.setSelectedWorkspaceId || (() => {});

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
