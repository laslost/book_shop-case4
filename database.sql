-- Создание базы данных книжного магазина
CREATE DATABASE IF NOT EXISTS bookstore;
USE bookstore;

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица книг
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    rent_price_2weeks DECIMAL(10,2) NOT NULL,
    rent_price_1month DECIMAL(10,2) NOT NULL,
    rent_price_3months DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT TRUE,
    isbn VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'rent')),
    duration VARCHAR(20),
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Индексы для оптимизации
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_year ON books(year);
CREATE INDEX idx_books_available ON books(available);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_book_id ON orders(book_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_expires_at ON orders(expires_at);

-- Вставка тестовых данных
INSERT INTO users (email, password_hash, name, is_admin) VALUES
('admin@bookstore.com', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Администратор', TRUE),
('user@bookstore.com', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Пользователь', FALSE);

-- Вставка книг из initializeBooks.ts
INSERT INTO books (title, author, category, year, price, rent_price_2weeks, rent_price_1month, rent_price_3months, description, image_url, available, isbn) VALUES
('Война и мир', 'Лев Толстой', 'Классическая литература', 1869, 1200.00, 150.00, 250.00, 600.00, 'Эпический роман-эпопея Льва Николаевича Толстого, описывающий русское общество в эпоху войн против Наполеона в 1805—1812 годах.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123456-7'),
('Преступление и наказание', 'Фёдор Достоевский', 'Классическая литература', 1866, 1000.00, 120.00, 200.00, 500.00, 'Социально-психологический и социально-философский роман, в котором автор впервые сформулировал многие из своих философских принципов.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123456-8'),
('Мастер и Маргарита', 'Михаил Булгаков', 'Классическая литература', 1967, 950.00, 100.00, 180.00, 450.00, 'Роман Михаила Афанасьевича Булгакова, работа над которым началась в конце 1920-х годов и продолжалась вплоть до смерти писателя.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123456-9'),
('1984', 'Джордж Оруэлл', 'Антиутопия', 1949, 800.00, 90.00, 150.00, 400.00, 'Роман-антиутопия Джорджа Оруэлла, изданный в 1949 году. Наряду с романом О дивный новый мир — одна из самых известных антиутопий.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123457-0'),
('Гарри Поттер и философский камень', 'Дж. К. Роулинг', 'Фэнтези', 1997, 700.00, 80.00, 130.00, 350.00, 'Первый роман в серии книг о Гарри Поттере, написанный Дж. К. Роулинг. Книга рассказывает о мальчике-сироте, который узнаёт, что он волшебник.', 'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123457-1'),
('Властелин колец: Братство кольца', 'Дж. Р. Р. Толкин', 'Фэнтези', 1954, 1100.00, 140.00, 220.00, 550.00, 'Первая часть эпического романа-фэнтези английского писателя Дж. Р. Р. Толкина, повествующая о путешествии хоббита Фродо.', 'https://images.unsplash.com/photo-1535905557558-afc4877cdf3f?w=300&h=400&fit=crop&crop=edges', FALSE, '978-5-17-123457-2'),
('Архипелаг ГУЛАГ', 'Александр Солженицын', 'Документальная проза', 1973, 1500.00, 180.00, 300.00, 750.00, 'Художественно-историческое произведение Александра Исаевича Солженицына о репрессиях в СССР в период с 1918 по 1956 годы.', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123457-3'),
('Код да Винчи', 'Дэн Браун', 'Детектив', 2003, 650.00, 70.00, 120.00, 300.00, 'Детективный роман американского писателя Дэна Брауна. Книга следует символогу Роберту Лэнгдону и криптографу Софи Невё.', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop&crop=edges', TRUE, '978-5-17-123457-4');