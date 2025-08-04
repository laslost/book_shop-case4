import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Order } from '@/types'

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      console.log('Loading orders...')
      const response = await api.get('/orders')
      console.log('Orders response:', response.data)
      setOrders(response.data.orders)
      
      // Debug: check raw orders data
      try {
        const debugResponse = await api.get('/debug/orders')
        console.log('DEBUG - Raw orders from DB:', debugResponse.data)
      } catch (debugError) {
        console.log('Debug endpoint not available')
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | undefined | string) => {
    console.log('Formatting price:', price, typeof price)
    
    // Convert string to number if needed
    let numericPrice: number
    if (typeof price === 'string') {
      numericPrice = parseFloat(price)
      console.log('Converted string price to number:', numericPrice)
    } else if (typeof price === 'number') {
      numericPrice = price
    } else {
      console.log('Price is invalid, returning —')
      return '—'
    }
    
    if (isNaN(numericPrice)) {
      console.log('Price is NaN, returning —')
      return '—'
    }
    
    const formatted = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(numericPrice)
    console.log('Formatted price:', formatted)
    return formatted
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен'
      case 'completed':
        return 'Завершен'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
    }
  }

  const getDurationText = (duration: string) => {
    switch (duration) {
      case '2weeks': return '2 недели'
      case '1month': return '1 месяц'
      case '3months': return '3 месяца'
      default: return duration
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 animate-pulse" />
        <p>Загрузка заказов...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Мои заказы</h2>
        <div className="text-sm text-gray-600">
          Всего заказов: {orders.length}
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">У вас пока нет заказов</p>
            <p className="text-sm text-gray-500 mt-2">
              Перейдите в магазин, чтобы сделать первый заказ
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <CardTitle className="text-lg">
                      Заказ #{order.id}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'active' 
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.book && (
                  <div className="flex items-start space-x-4">
                    <img
                      src={order.book.imageUrl || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop&crop=edges`}
                      alt={order.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold">{order.book.title}</h3>
                        <p className="text-sm text-gray-600">{order.book.author}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Тип:</span>
                          <span className="ml-2 font-medium">
                            {order.type === 'purchase' ? 'Покупка' : 'Аренда'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Сумма:</span>
                          <span className="ml-2 font-medium">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </div>
                        {order.type === 'rent' && order.duration && (
                          <div>
                            <span className="text-gray-500">Срок:</span>
                            <span className="ml-2 font-medium">
                              {getDurationText(order.duration)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Дата:</span>
                          <span className="ml-2 font-medium">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        {order.expiresAt && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Истекает:</span>
                            <span className="ml-2 font-medium">
                              {formatDate(order.expiresAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}