import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

function App() {
  return (
    <WorkspaceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Layout>
    </WorkspaceProvider>
  );
}

export default App;
