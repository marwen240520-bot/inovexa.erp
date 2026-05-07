-- Supprimer l'ancien compte s'il existe
DELETE FROM users WHERE email = 'marwen2405@gmail.com';

-- Créer le compte admin (mot de passe: 123456)
INSERT INTO users (email, password, name, role, isActive) 
VALUES ('marwen2405@gmail.com', '.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'admin', 1);
