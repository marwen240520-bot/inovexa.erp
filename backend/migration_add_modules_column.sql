-- Migration pour ajouter la colonne modules à la table users
-- Exécuter dans phpMyAdmin ou via la ligne de commande

ALTER TABLE users ADD COLUMN modules JSON DEFAULT '{}';

-- Vérifier que la colonne a été ajoutée
DESCRIBE users;