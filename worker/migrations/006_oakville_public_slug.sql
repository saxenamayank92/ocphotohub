-- Preserve the live Oakville tenant ID while giving it the requested public URL.
UPDATE clubs
SET slug = 'theoakvilleclub'
WHERE id = 'oakville' AND slug = 'oakville';
