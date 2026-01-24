import React, { createContext, useContext, useState, useEffect } from 'react';
import { listEnvironments } from '../services/api';
import type { Environment } from '../types';
import { useWorkspace } from './WorkspaceContext';

interface EnvironmentContextType {
  selectedEnvironmentId: string | null;
  setSelectedEnvironmentId: (id: string | null) => void;
  environments: Environment[];
  refreshEnvironments: () => Promise<void>;
  loading: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const { selectedWorkspaceId } = useWorkspace();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshEnvironments = async () => {
    if (!selectedWorkspaceId) {
      setEnvironments([]);
      setSelectedEnvironmentId(null);
      return;
    }

    setLoading(true);
    try {
      const envs = await listEnvironments(selectedWorkspaceId);
      setEnvironments(envs);
      
      // Auto-select first environment if none selected
      if (envs.length > 0 && !selectedEnvironmentId) {
        setSelectedEnvironmentId(envs[0].id);
      } else if (envs.length === 0) {
        setSelectedEnvironmentId(null);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEnvironments();
  }, [selectedWorkspaceId]);

  return (
    <EnvironmentContext.Provider
      value={{
        selectedEnvironmentId,
        setSelectedEnvironmentId,
        environments,
        refreshEnvironments,
        loading,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}
