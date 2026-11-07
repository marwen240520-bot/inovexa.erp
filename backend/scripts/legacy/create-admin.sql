DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'marwen2405@gmail.com') THEN
        INSERT INTO users (email, password, name, role, "isActive", "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt")
        VALUES (
            'marwen2405@gmail.com',
            '$2b$10$QJcQJcQJcQJcQJcQJcQJcQ',
            'Admin',
            'admin',
            true,
            NOW(),
            NOW() + INTERVAL '10 years',
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Admin créé avec succès';
    ELSE
        RAISE NOTICE '✅ Admin existe déjà';
    END IF;
END $$;
