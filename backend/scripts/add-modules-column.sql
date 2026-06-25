BEGIN;

-- Ajouter la colonne modules si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'modules'
    ) THEN
        ALTER TABLE users ADD COLUMN modules JSON DEFAULT '{}';
        RAISE NOTICE '✅ Colonne modules ajoutée avec succès';
    ELSE
        RAISE NOTICE '⚠️ La colonne modules existe déjà';
    END IF;
END $$;

-- Mettre à jour les utilisateurs existants
UPDATE users SET modules = '{}' WHERE modules IS NULL;

COMMIT;
