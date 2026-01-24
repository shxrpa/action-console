import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface WorkspaceContextType {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  return (
    <WorkspaceContext.Provider value={{ selectedWorkspaceId, setSelectedWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
