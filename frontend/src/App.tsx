import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import ActionCatalogPage from './pages/ActionCatalogPage';
import ActionDetailPage from './pages/ActionDetailPage';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

function App() {
  return (
    <WorkspaceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:collectionId/actions" element={<ActionCatalogPage />} />
          <Route path="/collections/:collectionId/actions/:actionId" element={<ActionDetailPage />} />
        </Routes>
      </Layout>
    </WorkspaceProvider>
  );
}

export default App;
