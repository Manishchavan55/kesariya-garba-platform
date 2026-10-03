CREATE DATABASE IF NOT EXISTS kesariya_garba;
USE kesariya_garba;

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  event_date DATETIME NOT NULL,
  venue VARCHAR(200) NOT NULL,
  city VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  available_seats INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE KEY uq_payment_id (razorpay_payment_id)
);

INSERT INTO events
  (title, event_date, venue, city, price, capacity, available_seats)
SELECT
  'Kesariya Garba Night 2026',
  '2026-10-24 19:00:00',
  'Grand Celebration Ground',
  'Pune',
  499.00,
  2000,
  2000
WHERE NOT EXISTS (
  SELECT 1 FROM events WHERE title = 'Kesariya Garba Night 2026'
);
