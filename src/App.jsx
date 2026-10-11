import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MaterialProvider } from './context/MaterialContext';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import LandingPage from './pages/landing/LandingPage';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import Statistics from './pages/admin/Statistics';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import FileManager from './pages/modules/FileManager';
import Modulos from './pages/modules/Modulos';
import Material from './pages/modules/Material';
import VideoLibrary from './pages/video/VideoLibrary';
import ExamSimulator from './pages/exam/ExamSimulator';
import SimuladoresQuizzes from './pages/exam/SimuladoresQuizzes';
import MaestroQuizzes from './pages/exam/MaestroQuizzes';
import Whiteboard from './pages/whiteboard/Whiteboard';

function AppContent() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [customQuizzes, setCustomQuizzes] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    setActiveSection('dashboard');
  }, [user?.id]);

  function handleNavigation(section, moduleId = null) {
    setActiveSection(section);
    setActiveModuleId(moduleId);
    if (isMobile) setSidebarOpen(false);
  }

  function addCustomQuiz(quiz) {
    setCustomQuizzes(prev => [...prev, quiz]);
  }

  function deleteCustomQuiz(quizId) {
    setCustomQuizzes(prev => prev.filter(q => q.id !== quizId));
  }

  const [showLogin, setShowLogin] = useState(false);

  if (!user) {
    if (showLogin) return <Login onBack={() => setShowLogin(false)} />;
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  function renderSection() {
    if (user.role === 'admin') {
      if (activeSection === 'dashboard') return <AdminDashboard view="overview" onNavigate={handleNavigation} />;
      if (activeSection === 'students')  return <AdminDashboard view="students" />;
      if (activeSection === 'stats') return <Statistics />;
    }

    if (user.role === 'teacher') {
      if (activeSection === 'dashboard') return <TeacherDashboard setActiveSection={handleNavigation} />;
      if (activeSection === 'stats') return <Statistics />;
    }

    if (user.role === 'student') {
      if (activeSection === 'dashboard') return <StudentDashboard setActiveSection={handleNavigation} />;
      if (activeSection === 'modules')   return <Modulos defaultModuleId={activeModuleId} />;
      if (activeSection === 'exam')      return <SimuladoresQuizzes customQuizzes={customQuizzes} onAddQuiz={addCustomQuiz} onDeleteQuiz={deleteCustomQuiz} />;
    }

    if (user.role === 'teacher') {
      if (activeSection === 'modules')   return <Material defaultModuleId={activeModuleId} />;
      if (activeSection === 'exam')      return <MaestroQuizzes />;
    }

    if (user.role === 'admin') {
      if (activeSection === 'modules')   return <Material defaultModuleId={activeModuleId} />;
      if (activeSection === 'exam')      return <MaestroQuizzes />;
      if (activeSection === 'payments')  return (
        <div className="flex items-center justify-center h-full p-8 text-white/60">
          TODO(rediseno): Pagos — sin mockup todavía.
        </div>
      );
    }

    if (activeSection === 'modules') return <FileManager defaultModuleId={activeModuleId} />;
    if (activeSection === 'videos') return <VideoLibrary />;
    if (activeSection === 'exam') return <ExamSimulator customQuizzes={customQuizzes} onAddQuiz={addCustomQuiz} onDeleteQuiz={deleteCustomQuiz} />;
    if (activeSection === 'whiteboard' && user.role !== 'student') return <Whiteboard />;

    return (
      <div className="flex items-center justify-center h-full text-white/60 text-lg p-8">
        Sección en desarrollo.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile overlay — closes sidebar on tap outside */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 45,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleNavigation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <Header
          activeSection={activeSection}
          onMenuToggle={() => setSidebarOpen(p => !p)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection + user.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MaterialProvider>
        <AppContent />
      </MaterialProvider>
    </AuthProvider>
  );
}
