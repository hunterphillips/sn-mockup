import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface NavContextValue {
  isNavOpen: boolean
  isNavPinned: boolean
  setNavOpen: (open: boolean) => void
  toggleNavPin: () => void
}

const NavContext = createContext<NavContextValue | null>(null)

const NAV_PINNED_KEY = 'sn-nav-pinned'

export function NavProvider({ children }: { children: ReactNode }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isNavPinned, setIsNavPinned] = useState(() => {
    const stored = localStorage.getItem(NAV_PINNED_KEY)
    return stored === 'true'
  })

  // Persist pinned state
  useEffect(() => {
    localStorage.setItem(NAV_PINNED_KEY, String(isNavPinned))
  }, [isNavPinned])

  // When pinned, always keep open
  useEffect(() => {
    if (isNavPinned) {
      setIsNavOpen(true)
    }
  }, [isNavPinned])

  const setNavOpen = useCallback((open: boolean) => {
    // Can't close if pinned
    if (isNavPinned && !open) return
    setIsNavOpen(open)
  }, [isNavPinned])

  const toggleNavPin = useCallback(() => {
    setIsNavPinned(prev => {
      const newPinned = !prev
      // If unpinning, close the menu
      if (!newPinned) {
        setIsNavOpen(false)
      }
      return newPinned
    })
  }, [])

  return (
    <NavContext.Provider value={{ isNavOpen, isNavPinned, setNavOpen, toggleNavPin }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const context = useContext(NavContext)
  if (!context) {
    throw new Error('useNav must be used within a NavProvider')
  }
  return context
}
