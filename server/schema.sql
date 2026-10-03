CREATE DATABASE IF NOT EXISTS kesariya_garba;
USE kesariya_garba;

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  venue VARCHAR(200) NOT NULL,
  city VARCHAR(120) NOT NULL,
  parking_info VARCHAR(255),
  entry_guidelines TEXT,
  price DECIMAL(10,2) NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  available_seats INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available_quantity INT UNSIGNED NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(40) NOT NULL UNIQUE,
  event_id INT UNSIGNED NOT NULL,
  ticket_category_id INT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  transaction_ref VARCHAR(120) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('success','failed','refunded') DEFAULT 'success',
  gateway VARCHAR(40) DEFAULT 'dummy',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qr_tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  qr_token VARCHAR(120) NOT NULL UNIQUE,
  verification_status ENUM('unused','used','invalid') DEFAULT 'unused',
  scanned_at DATETIME NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gallery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40),
  message TEXT NOT NULL,
  status ENUM('new','resolved') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events
  (title, description, event_date, venue, city, parking_info, entry_guidelines, price, capacity, available_seats)
SELECT
  'Kesariya Grand Garba Night',
  'A premium Navratri celebration with live garba, dandiya, folk beats, lights and food stalls.',
  '2026-10-24 19:00:00',
  'Grand Celebration Ground',
  'Pune',
  'On-site parking and paid overflow parking nearby.',
  'Carry a valid booking QR. Gates open at 6:00 PM. No outside food or drinks.',
  499.00, 2500, 2500
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Kesariya Grand Garba Night');

SET @event_id = (SELECT id FROM events WHERE title = 'Kesariya Grand Garba Night' LIMIT 1);

INSERT INTO ticket_categories (event_id, name, price, available_quantity)
SELECT @event_id, 'Regular Pass', 499.00, 1800
WHERE NOT EXISTS (SELECT 1 FROM ticket_categories WHERE event_id=@event_id AND name='Regular Pass');

INSERT INTO ticket_categories (event_id, name, price, available_quantity)
SELECT @event_id, 'Couple Pass', 899.00, 500
WHERE NOT EXISTS (SELECT 1 FROM ticket_categories WHERE event_id=@event_id AND name='Couple Pass');

INSERT INTO ticket_categories (event_id, name, price, available_quantity)
SELECT @event_id, 'VIP Circle', 1499.00, 200
WHERE NOT EXISTS (SELECT 1 FROM ticket_categories WHERE event_id=@event_id AND name='VIP Circle');
