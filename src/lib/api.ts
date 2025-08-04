import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Adding token to request:', config.url)
  }
  return config
})

// Обрабатываем ошибки
api.interceptors.response.use(
  (response) => {
    console.log('API response success:', response.config.url)
    return response
  },
  (error) => {
    console.error('API response error:', error.config?.url, error.response?.status, error.response?.data)
    
    // Только при 401 (Unauthorized) удаляем токен и перенаправляем
    if (error.response?.status === 401) {
      console.log('Unauthorized, removing token and redirecting to login')
      localStorage.removeItem('token')
      // Не делаем window.location.href = '/login' здесь, 
      // пусть AuthContext сам обработает это
    }
    return Promise.reject(error)
  }
)