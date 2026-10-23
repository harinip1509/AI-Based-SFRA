import './index.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTheme } from './lib/theme'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Process from './components/Process'
import ProblemSolution from './components/ProblemSolution'
import Technology from './components/Technology'
import { CTA, Footer } from './components/CtaFooter'
import AnimatedSection from './components/AnimatedSection'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Results from './pages/Results'
import SubstationsRadar from './pages/SubstationsRadar'
import ProtectedRoute from './auth/ProtectedRoute'
import SubstationChatbot from './components/SubstationChatbot'

export default function App() {
  const { isDark } = useTheme()

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,212,255,0.4); }
          50%      { opacity:0.7; box-shadow:0 0 0 6px rgba(0,212,255,0); }
        }
      `}</style>
      <Routes>
        <Route
          path="/"
          element={(
            <div
              style={{
                backgroundColor: isDark ? '#0B0F1A' : '#F8FAFC',
                color: isDark ? '#F9FAFB' : '#0F172A',
                minHeight: '100vh',
                position: 'relative',
                transition: 'background-color 0.35s ease, color 0.35s ease',
              }}
            >
              <Navbar />
              {/* Hero is 100vh, sits in normal document flow */}
              <AnimatedSection>
                <Hero />
              </AnimatedSection>
              {/* All subsequent sections flow normally below the hero */}
              <main>
                <AnimatedSection>
                  <Features />
                </AnimatedSection>
                <AnimatedSection>
                  <Process />
                </AnimatedSection>
                <AnimatedSection>
                  <ProblemSolution />
                </AnimatedSection>
                <AnimatedSection>
                  <Technology />
                </AnimatedSection>
                <AnimatedSection>
                  <CTA />
                </AnimatedSection>
              </main>
              <Footer />
            </div>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/substations" element={<SubstationsRadar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SubstationChatbot />
    </>
  )
}
