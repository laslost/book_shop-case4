import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, ShoppingCart, Book as BookIcon } from 'lucide-react'
import type { Book, CreateOrderData } from '@/types'

export function BookStorePage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [orderType, setOrderType] = useState<'purchase' | 'rent'>('purchase')
  const [rentDuration, setRentDuration] = useState<string>('2weeks')
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    year: ''
  })
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [books, filters])

  const loadBooks = async () => {
    try {
      const response = await api.get('/books')
      setBooks(response.data.books)
    } catch (error) {
      console.error('Ошибка загрузки книг:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = books

    if (filters.search) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.author.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.category) {
      filtered = filtered.filter(book => book.category === filters.category)
    }

    if (filters.author) {
      filtered = filtered.filter(book => book.author === filters.author)
    }

    if (filters.year) {
      filtered = filtered.filter(book => book.year.toString() === filters.year)
    }

    setFilteredBooks(filtered)
  }

  const handleOrder = async () => {
    if (!selectedBook) return
    try {
      const orderData: CreateOrderData = {
        bookId: selectedBook.id,
        type: orderType,
        duration: orderType === 'rent' ? rentDuration : undefined
      }
      await api.post('/orders', orderData)
      setSelectedBook(null)
      setSuccessMessage('Заказ успешно оформлен!')
      setTimeout(() => setSuccessMessage(''), 3000)
      loadBooks()
    } catch (error: any) {
      setSuccessMessage(error.response?.data?.message || 'Ошибка создания заказа')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const getUniqueValues = (field: keyof Book) => {
    // Возвращаем только строки или числа, фильтруем undefined и объекты
    return Array.from(new Set(books.map(book => book[field]))).filter(
      v => typeof v === 'string' || typeof v === 'number'
    ) as (string | number)[]
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB' 
    }).format(price)
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
        <BookIcon className="h-12 w-12 mx-auto mb-4 animate-pulse" />
        <p>Загрузка книг...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию или автору..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Все категории</option>
              {getUniqueValues('category').map(category => (
                <option key={String(category)} value={String(category)}>{category}</option>
              ))}
            </select>
            <select
              value={filters.author}
              onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Все авторы</option>
              {getUniqueValues('author').map(author => (
                <option key={String(author)} value={String(author)}>{author}</option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Все годы</option>
              {getUniqueValues('year').map(year => (
                <option key={String(year)} value={String(year)}>{year}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Список книг */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id}>
            <CardHeader className="pb-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-md overflow-hidden mb-4">
                <img
                  src={book.imageUrl || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop&crop=edges`}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
                <p className="text-sm text-gray-600">{book.author}</p>
                <p className="text-xs text-gray-500">{book.category} • {book.year}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Покупка:</span>
                  <span className="font-semibold">{formatPrice(book.price)}</span>
                </div>
                {book.rentPrice && (
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Аренда (2 нед.):</span>
                      <span>{formatPrice(book.rentPrice['2weeks'])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Аренда (1 мес.):</span>
                      <span>{formatPrice(book.rentPrice['1month'])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Аренда (3 мес.):</span>
                      <span>{formatPrice(book.rentPrice['3months'])}</span>
                    </div>
                  </div>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    disabled={!book.available}
                    onClick={() => setSelectedBook(book)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {book.available ? 'Заказать' : 'Недоступна'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Оформить заказ</DialogTitle>
                  </DialogHeader>
                  {selectedBook && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedBook.imageUrl || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop&crop=edges`}
                          alt={selectedBook.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-semibold">{selectedBook.title}</h3>
                          <p className="text-sm text-gray-600">{selectedBook.author}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Тип заказа:</label>
                          <div className="flex space-x-4 mt-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="purchase"
                                checked={orderType === 'purchase'}
                                onChange={(e) => setOrderType(e.target.value as 'purchase' | 'rent')}
                                className="mr-2"
                              />
                              Покупка ({formatPrice(selectedBook.price)})
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="rent"
                                checked={orderType === 'rent'}
                                onChange={(e) => setOrderType(e.target.value as 'purchase' | 'rent')}
                                className="mr-2"
                              />
                              Аренда
                            </label>
                          </div>
                        </div>

                        {orderType === 'rent' && (
                          <div>
                            <label className="text-sm font-medium">Срок аренды:</label>
                            <select
                              value={rentDuration}
                              onChange={(e) => setRentDuration(e.target.value)}
                              className="w-full mt-2 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                            >
                              <option value="2weeks">2 недели - {formatPrice(selectedBook.rentPrice['2weeks'])}</option>
                              <option value="1month">1 месяц - {formatPrice(selectedBook.rentPrice['1month'])}</option>
                              <option value="3months">3 месяца - {formatPrice(selectedBook.rentPrice['3months'])}</option>
                            </select>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <Button onClick={handleOrder} className="w-full">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Оформить заказ
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <BookIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Книги не найдены</p>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-center mb-4">
          {successMessage}
        </div>
      )}
    </div>
  )
}