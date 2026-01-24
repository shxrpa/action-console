import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

export default Layout;
