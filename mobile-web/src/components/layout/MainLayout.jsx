import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <main className="flex-1 pb-16">
        {children}
      </main>
      <Footer />
      <BottomNavigation onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default MainLayout;
