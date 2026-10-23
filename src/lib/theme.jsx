import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
  seniorMode: false,
  toggleSeniorMode: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('intellifra_theme')
      if (saved === 'light' || saved === 'dark') return saved
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  const [seniorMode, setSeniorMode] = useState(() => {
    try {
      return localStorage.getItem('intellifra_senior_mode') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('intellifra_theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
      if (theme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        document.body.style.backgroundColor = '#F8FAFC'
        document.body.style.color = '#0F172A'
      } else {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
        document.body.style.backgroundColor = '#0B0F1A'
        document.body.style.color = '#F8FAFC'
      }
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem('intellifra_senior_mode', seniorMode ? 'true' : 'false')
      document.documentElement.setAttribute('data-senior', seniorMode ? 'true' : 'false')
      if (seniorMode) {
        document.documentElement.classList.add('senior-mode')
      } else {
        document.documentElement.classList.remove('senior-mode')
      }
    } catch {
      // ignore
    }
  }, [seniorMode])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleSeniorMode = () => {
    setSeniorMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        seniorMode,
        toggleSeniorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
