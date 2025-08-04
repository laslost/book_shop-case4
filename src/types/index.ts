export interface User {
    id: number
    email: string
    name: string
    isAdmin: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface Book {
    id: number
    title: string
    author: string
    category: string
    year: number
    price: number
    rentPrice: {
      '2weeks': number
      '1month': number
      '3months': number
    }
    description: string
    imageUrl?: string
    available: boolean
    isbn?: string
    createdAt: string
    updatedAt: string
  }
  
  export interface Order {
    id: number
    userId: number
    bookId: number
    type: 'purchase' | 'rent'
    duration?: string
    totalPrice: number
    status: 'active' | 'completed' | 'cancelled'
    createdAt: string
    expiresAt?: string
    book?: Book
    user?: User
  }
  
  export interface LoginData {
    email: string
    password: string
  }
  
  export interface RegisterData {
    email: string
    password: string
    name: string
    isAdmin: boolean
  }
  
  export interface CreateOrderData {
    bookId: number
    type: 'purchase' | 'rent'
    duration?: string
  }