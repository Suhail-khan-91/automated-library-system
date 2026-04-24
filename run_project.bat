@echo off
echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
)

if not exist "library.db" (
    echo Initializing database...
    node init_db.js
)

echo Starting server...
node server.js
pause
