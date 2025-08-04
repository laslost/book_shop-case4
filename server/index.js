const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bookstore',
  password: process.env.DB_PASSWORD || '564564',
  port: process.env.DB_PORT || 5432,
})

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Недействительный токен' })
    }
    req.user = user
    next()
  })
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, isAdmin } = req.body

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, email, name, is_admin, created_at',
      [email, hashedPassword, name, isAdmin || false]
    )

    const user = newUser.rows[0]

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Ошибка сервера при регистрации' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Неверный email или пароль' })
    }

    const userData = user.rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, userData.password_hash)
    if (!validPassword) {
      return res.status(400).json({ message: 'Неверный email или пароль' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email, isAdmin: userData.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        isAdmin: userData.is_admin
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Ошибка сервера при входе' })
  }
})

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, name, is_admin FROM users WHERE id = $1',
      [req.user.id]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.json({
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name,
        isAdmin: user.rows[0].is_admin
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Books routes
app.get('/api/books', async (req, res) => {
  try {
    const books = await pool.query(`
      SELECT 
        id, title, author, category, year, price,
        rent_price_2weeks, rent_price_1month, rent_price_3months,
        description, image_url, available, isbn, created_at, updated_at
      FROM books
      ORDER BY created_at DESC
    `)

    const formattedBooks = books.rows.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      year: book.year,
      price: book.price,
      rentPrice: {
        '2weeks': book.rent_price_2weeks,
        '1month': book.rent_price_1month,
        '3months': book.rent_price_3months
      },
      description: book.description,
      imageUrl: book.image_url, // <-- теперь всегда своё поле
      available: book.available,
      isbn: book.isbn,
      createdAt: book.created_at,
      updatedAt: book.updated_at
    }))

    res.json({ books: formattedBooks })
  } catch (error) {
    console.error('Get books error:', error)
    res.status(500).json({ message: 'Ошибка получения книг' })
  }
})

app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен. Только для администраторов' })
    }

    const {
      title, author, category, year, price,
      rentPrice, description, imageUrl, available, isbn
    } = req.body

    const newBook = await pool.query(`
      INSERT INTO books (
        title, author, category, year, price,
        rent_price_2weeks, rent_price_1month, rent_price_3months,
        description, image_url, available, isbn
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, author, category, year, price,
      rentPrice['2weeks'], rentPrice['1month'], rentPrice['3months'],
      description, imageUrl, available, isbn
    ])

    const book = newBook.rows[0]
    res.json({
      book: {
        ...book,
        rentPrice: {
          '2weeks': book.rent_price_2weeks,
          '1month': book.rent_price_1month,
          '3months': book.rent_price_3months
        }
      }
    })
  } catch (error) {
    console.error('Add book error:', error)
    res.status(500).json({ message: 'Ошибка добавления книги' })
  }
})

app.put('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен. Только для администраторов' })
    }

    const { id } = req.params
    const {
      title, author, category, year, price,
      rentPrice, description, imageUrl, available, isbn
    } = req.body

    const updatedBook = await pool.query(`
      UPDATE books SET
        title = $1, author = $2, category = $3, year = $4, price = $5,
        rent_price_2weeks = $6, rent_price_1month = $7, rent_price_3months = $8,
        description = $9, image_url = $10, available = $11, isbn = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      title, author, category, year, price,
      rentPrice['2weeks'], rentPrice['1month'], rentPrice['3months'],
      description, imageUrl, available, isbn, id
    ])

    if (updatedBook.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' })
    }

    const book = updatedBook.rows[0]
    res.json({
      book: {
        ...book,
        rentPrice: {
          '2weeks': book.rent_price_2weeks,
          '1month': book.rent_price_1month,
          '3months': book.rent_price_3months
        }
      }
    })
  } catch (error) {
    console.error('Update book error:', error)
    res.status(500).json({ message: 'Ошибка обновления книги' })
  }
})

app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен. Только для администраторов' })
    }

    const { id } = req.params
    const deletedBook = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    )

    if (deletedBook.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' })
    }

    res.json({ message: 'Книга успешно удалена' })
  } catch (error) {
    console.error('Delete book error:', error)
    res.status(500).json({ message: 'Ошибка удаления книги' })
  }
})

// Orders routes
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { bookId, type, duration } = req.body

    // Get book details
    const book = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [bookId]
    )

    if (book.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' })
    }

    const bookData = book.rows[0]

    if (!bookData.available) {
      return res.status(400).json({ message: 'Книга недоступна' })
    }

    // Calculate price
    let totalPrice = 0
    let expiresAt = null

    if (type === 'purchase') {
      totalPrice = bookData.price
    } else if (type === 'rent') {
      switch (duration) {
        case '2weeks':
          totalPrice = bookData.rent_price_2weeks
          expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          break
        case '1month':
          totalPrice = bookData.rent_price_1month
          expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          totalPrice = bookData.rent_price_3months
          expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          break
        default:
          return res.status(400).json({ message: 'Неверный срок аренды' })
      }
    }

    console.log('Creating order with totalPrice:', totalPrice, 'type:', type, 'duration:', duration)

    // Create order
    const newOrder = await pool.query(`
      INSERT INTO orders (user_id, book_id, type, duration, total_price, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, bookId, type, duration, totalPrice, expiresAt])

    // If it's a rent, mark book as unavailable
    if (type === 'rent') {
      await pool.query(
        'UPDATE books SET available = false WHERE id = $1',
        [bookId]
      )
    }

    const order = newOrder.rows[0]
    console.log('Created order with total_price:', order.total_price)
    
    res.json({
      order: {
        id: order.id,
        userId: order.user_id,
        bookId: order.book_id,
        type: order.type,
        duration: order.duration,
        totalPrice: order.total_price,
        status: order.status,
        createdAt: order.created_at,
        expiresAt: order.expires_at
      },
      message: 'Заказ успешно создан'
    })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ message: 'Ошибка создания заказа' })
  }
})

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.*, b.title, b.author, b.image_url
      FROM orders o
      JOIN books b ON o.book_id = b.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id])

    console.log('Raw orders from DB:', orders.rows.map(o => ({
      id: o.id,
      total_price: o.total_price,
      total_price_type: typeof o.total_price
    })))

    const formattedOrders = orders.rows.map(order => ({
      id: order.id,
      userId: order.user_id,
      bookId: order.book_id,
      type: order.type,
      duration: order.duration,
      totalPrice: order.total_price, // <-- теперь всегда есть
      status: order.status,
      createdAt: order.created_at,   // <-- теперь всегда есть
      expiresAt: order.expires_at,
      book: {
        id: order.book_id,
        title: order.title,
        author: order.author,
        imageUrl: order.image_url
      }
    }))

    console.log('Formatted orders:', formattedOrders.map(o => ({
      id: o.id,
      totalPrice: o.totalPrice,
      totalPrice_type: typeof o.totalPrice
    })))

    res.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ message: 'Ошибка получения заказов' })
  }
})

// Debug endpoint to check orders data
app.get('/api/debug/orders', async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT id, user_id, book_id, type, duration, total_price, status, created_at, expires_at
      FROM orders
      ORDER BY id DESC
      LIMIT 10
    `)
    
    console.log('Debug orders data:', orders.rows)
    res.json({ orders: orders.rows })
  } catch (error) {
    console.error('Debug orders error:', error)
    res.status(500).json({ message: 'Ошибка получения данных' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})