import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BookOpen, LogOut, Shield, User, ShoppingCart } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Книжный магазин
              </h1>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  variant={location.pathname === '/' ? 'default' : 'outline'}
                  size="sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Магазин
                </Button>
              </Link>
              
              <Link to="/orders">
                <Button
                  variant={location.pathname === '/orders' ? 'default' : 'outline'}
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Мои заказы
                </Button>
              </Link>
              
              {user?.isAdmin && (
                <Link to="/admin">
                  <Button
                    variant={location.pathname === '/admin' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Админ-панель
                  </Button>
                </Link>
              )}
              
              <div className="flex items-center space-x-2 text-sm bg-gray-100 px-3 py-1 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user?.name}</span>
                {user?.isAdmin && <Shield className="h-3 w-3 text-blue-600" />}
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}