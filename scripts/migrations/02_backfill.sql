UPDATE users
SET phone_number = 'N/A'
WHERE phone_number IS NULL;

UPDATE users
SET profile_picture_url = 'default.png'
WHERE profile_picture_url IS NULL;