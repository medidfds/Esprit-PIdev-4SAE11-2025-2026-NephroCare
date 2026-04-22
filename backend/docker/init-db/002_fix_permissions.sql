-- Grant full privileges to the nephrocare user
-- This allows microservices to create their own databases (clinical_db, etc.)

GRANT ALL PRIVILEGES ON *.* TO 'nephrocare'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
