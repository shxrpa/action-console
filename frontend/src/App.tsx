import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import ActionCatalogPage from './pages/ActionCatalogPage';
import ActionDetailPage from './pages/ActionDetailPage';
import RunsListPage from './pages/RunsListPage';
import RunDetailPage from './pages/RunDetailPage';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { EnvironmentProvider } from './contexts/EnvironmentContext';
import { VariableWallet } from './components/VariableWallet';

function App() {
  return (
    <WorkspaceProvider>
      <EnvironmentProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:collectionId/actions" element={<ActionCatalogPage />} />
            <Route path="/collections/:collectionId/actions/:actionId" element={<ActionDetailPage />} />
            <Route path="/runs" element={<RunsListPage />} />
            <Route path="/runs/:runId" element={<RunDetailPage />} />
            <Route path="/variables" element={<VariableWallet />} />
          </Routes>
        </Layout>
      </EnvironmentProvider>
    </WorkspaceProvider>
  );
}

export default App;
