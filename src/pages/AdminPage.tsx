import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Book as BookIcon } from 'lucide-react';
import type { Book } from '@/types';


export function AdminPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: '',
    year: new Date().getFullYear(),
    price: 0,
    rentPrice: {
      '2weeks': 0,
      '1month': 0,
      '3months': 0
    },
    description: '',
    imageUrl: '',
    available: true,
    isbn: ''
  })

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      const response = await api.get('/books')
      setBooks(response.data.books)
    } catch (error) {
      console.error('Ошибка загрузки книг:', error)
      setMessage('Ошибка загрузки книг')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async () => {
    try {
      setLoading(true)
      
      const response = await api.post('/books', newBook)
      setBooks(prev => [...prev, response.data.book])
      setMessage('Книга успешно добавлена')
      setShowAddDialog(false)
      setNewBook({
        title: '',
        author: '',
        category: '',
        year: new Date().getFullYear(),
        price: 0,
        rentPrice: {
          '2weeks': 0,
          '1month': 0,
          '3months': 0
        },
        description: '',
        imageUrl: '',
        available: true,
        isbn: ''
      })
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Ошибка добавления книги:', error)
      setMessage(error.response?.data?.message || 'Ошибка добавления книги')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBook = async (book: Book) => {
    try {
      setLoading(true)
      
      const response = await api.put(`/books/${book.id}`, book)
      setBooks(prev => prev.map(b => b.id === book.id ? response.data.book : b))
      setMessage('Книга успешно обновлена')
      setEditingBook(null)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Ошибка обновления книги:', error)
      setMessage(error.response?.data?.message || 'Ошибка обновления книги')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBook = async (bookId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return

    try {
      setLoading(true)
      
      await api.delete(`/books/${bookId}`)
      setBooks(prev => prev.filter(b => b.id !== bookId))
      setMessage('Книга успешно удалена')
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Ошибка удаления книги:', error)
      setMessage(error.response?.data?.message || 'Ошибка удаления книги')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB' 
    }).format(price)
  }

  if (loading && books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookIcon className="h-12 w-12 mx-auto mb-4 animate-pulse" />
        <p>Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600">{message}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление книгами</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить книгу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить новую книгу</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Автор</label>
                <Input
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Категория</label>
                <Input
                  value={newBook.category}
                  onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Год</label>
                <Input
                  type="number"
                  value={newBook.year}
                  onChange={(e) => setNewBook({...newBook, year: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена покупки (₽)</label>
                <Input
                  type="number"
                  value={newBook.price}
                  onChange={(e) => setNewBook({...newBook, price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ISBN</label>
                <Input
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цены аренды (₽)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="2 недели"
                    value={newBook.rentPrice['2weeks']}
                    onChange={(e) => setNewBook({
                      ...newBook, 
                      rentPrice: {...newBook.rentPrice, '2weeks': parseFloat(e.target.value)}
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="1 месяц"
                    value={newBook.rentPrice['1month']}
                    onChange={(e) => setNewBook({
                      ...newBook, 
                      rentPrice: {...newBook.rentPrice, '1month': parseFloat(e.target.value)}
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="3 месяца"
                    value={newBook.rentPrice['3months']}
                    onChange={(e) => setNewBook({
                      ...newBook, 
                      rentPrice: {...newBook.rentPrice, '3months': parseFloat(e.target.value)}
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL изображения</label>
                <Input
                  value={newBook.imageUrl}
                  onChange={(e) => setNewBook({...newBook, imageUrl: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newBook.available}
                  onChange={(e) => setNewBook({...newBook, available: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label className="text-sm">Доступна для заказа</label>
              </div>
            </div>
            <Button onClick={handleAddBook} className="w-full" disabled={loading}>
              {loading ? 'Добавляем...' : 'Добавить книгу'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {books.map((book) => (
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    book.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {book.available ? 'Доступна' : 'Недоступна'}
                  </span>
                </div>
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

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Редактировать книгу</DialogTitle>
                    </DialogHeader>
                    {editingBook?.id === book.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Название</label>
                          <Input
                            value={editingBook.title}
                            onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Автор</label>
                          <Input
                            value={editingBook.author}
                            onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Категория</label>
                          <Input
                            value={editingBook.category}
                            onChange={(e) => setEditingBook({...editingBook, category: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Год</label>
                          <Input
                            type="number"
                            value={editingBook.year}
                            onChange={(e) => setEditingBook({...editingBook, year: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Цена покупки (₽)</label>
                          <Input
                            type="number"
                            value={editingBook.price}
                            onChange={(e) => setEditingBook({...editingBook, price: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Цены аренды (₽)</label>
                          <div className="grid grid-cols-3 gap-1">
                            <Input
                              type="number"
                              placeholder="2 нед"
                              value={editingBook.rentPrice?.['2weeks']}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                rentPrice: {...(editingBook.rentPrice || {}), '2weeks': parseFloat(e.target.value)}
                              })}
                            />
                            <Input
                              type="number"
                              placeholder="1 мес"
                              value={editingBook.rentPrice?.['1month']}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                rentPrice: {...(editingBook.rentPrice || {}), '1month': parseFloat(e.target.value)}
                              })}
                            />
                            <Input
                              type="number"
                              placeholder="3 мес"
                              value={editingBook.rentPrice?.['3months']}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                rentPrice: {...(editingBook.rentPrice || {}), '3months': parseFloat(e.target.value)}
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">URL изображения</label>
                          <Input
                            value={editingBook.imageUrl}
                            onChange={(e) => setEditingBook({ ...editingBook, imageUrl: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium">Описание</label>
                          <textarea
                            value={editingBook.description}
                            onChange={(e) => setEditingBook({...editingBook, description: e.target.value})}
                            rows={3}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingBook.available}
                            onChange={(e) => setEditingBook({...editingBook, available: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                          <label className="text-sm">Доступна для заказа</label>
                        </div>
                        <Button 
                          onClick={() => handleUpdateBook(editingBook)} 
                          disabled={loading}
                          className="md:col-span-2"
                        >
                          {loading ? 'Сохраняем...' : 'Сохранить изменения'}
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setEditingBook(book)}>
                        Начать редактирование
                      </Button>
                    )}
                  </DialogContent>
                </Dialog>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDeleteBook(book.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}