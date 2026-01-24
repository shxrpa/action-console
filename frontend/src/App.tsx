import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

function App() {
  return (
    <WorkspaceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
        </Routes>
      </Layout>
    </WorkspaceProvider>
  );
}

export default App;
