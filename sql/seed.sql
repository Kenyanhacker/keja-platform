-- Demo password for all seeded users: Admin@12345
INSERT INTO users (full_name, email, password_hash, role, status) VALUES
('KEJA Admin', 'admin@keja.co.ke', '$2a$10$yy3yelHS8oeCM0wdPoNwNe.aLQoYw64rMEP2FNpk64Gc/gdt0uSOC', 'admin', 'active'),
('Jane Wanjiku', 'jane.host@keja.co.ke', '$2a$10$yy3yelHS8oeCM0wdPoNwNe.aLQoYw64rMEP2FNpk64Gc/gdt0uSOC', 'host', 'active'),
('Brian Omondi', 'brian.host@keja.co.ke', '$2a$10$yy3yelHS8oeCM0wdPoNwNe.aLQoYw64rMEP2FNpk64Gc/gdt0uSOC', 'host', 'active'),
('Mercy Atieno', 'mercy.student@keja.co.ke', '$2a$10$yy3yelHS8oeCM0wdPoNwNe.aLQoYw64rMEP2FNpk64Gc/gdt0uSOC', 'user', 'active');

INSERT INTO listings
  (host_id, title, description, location, price, rental_type, amenities, image_urls, map_url, popularity_score)
VALUES
  (2, 'Clean Bedsitter near Stage', 'Student-safe place with strong Wi-Fi.', 'Kamulu', 6500, 'Bedsitter',
   ARRAY['Wi-Fi', 'Water', 'Security'], ARRAY['https://picsum.photos/seed/kejaA/700/500'], 'https://www.google.com/maps/search/Kamulu', 92),
  (3, 'One Bedroom with Balcony', 'Quiet environment with CCTV and caretaker.', 'Joska', 8500, 'One Bedroom',
   ARRAY['CCTV', 'Water', 'Security'], ARRAY['https://picsum.photos/seed/kejaB/700/500'], 'https://www.google.com/maps/search/Joska', 88),
  (2, 'Budget Single Room', 'Affordable and near matatu stage.', 'Ngondu', 4800, 'Single Room',
   ARRAY['Water', 'Security'], ARRAY['https://picsum.photos/seed/kejaC/700/500'], 'https://www.google.com/maps/search/Ngondu', 79);

INSERT INTO reviews (listing_id, host_id, user_id, rating, comment) VALUES
  (1, 2, 4, 5, 'Very clean and safe, host responds fast.'),
  (2, 3, 4, 4, 'Nice place and close to shops.');

INSERT INTO chat_messages (listing_id, sender_id, receiver_id, message) VALUES
  (1, 4, 2, 'Hi, is the room still available this weekend?'),
  (1, 2, 4, 'Yes, you can come Saturday at 11am.');
