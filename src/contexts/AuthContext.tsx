import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../lib/api'

interface User {
  id: number
  email: string
  name: string
  isAdmin: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, isAdmin: boolean) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      console.log('AuthProvider mounted, checking auth...')
      setInitialized(true)
      checkAuth()
    }
  }, [initialized])

  const checkAuth = async () => {
    console.log('=== CHECK AUTH START ===')
    try {
      const token = localStorage.getItem('token')
      console.log('Token from localStorage:', token ? 'EXISTS' : 'NOT FOUND')
      
      if (token) {
        console.log('Token found, length:', token.length)
        console.log('Token preview:', token.substring(0, 20) + '...')
        
        console.log('Making API call to /auth/me...')
        const response = await api.get('/auth/me')
        console.log('API response received:', response.data)
        console.log('User data:', response.data.user)
        
        setUser(response.data.user)
        console.log('User set successfully')
      } else {
        console.log('No token found in localStorage')
        setUser(null)
      }
    } catch (error: any) {
      console.error('Auth check failed with error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      console.log('=== CHECK AUTH END ===')
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('=== LOGIN START ===')
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      console.log('Login response received:', { token: token ? 'EXISTS' : 'MISSING', user })
      console.log('Saving token to localStorage...')
      localStorage.setItem('token', token)
      console.log('Token saved, setting user...')
      setUser(user)
      console.log('=== LOGIN END ===')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, isAdmin: boolean) => {
    try {
      console.log('=== REGISTER START ===')
      const response = await api.post('/auth/register', { email, password, name, isAdmin })
      const { token, user } = response.data
      console.log('Register response received:', { token: token ? 'EXISTS' : 'MISSING', user })
      console.log('Saving token to localStorage...')
      localStorage.setItem('token', token)
      console.log('Token saved, setting user...')
      setUser(user)
      console.log('=== REGISTER END ===')
    } catch (error) {
      console.error('Register failed:', error)
      throw error
    }
  }

  const logout = () => {
    console.log('=== LOGOUT ===')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}