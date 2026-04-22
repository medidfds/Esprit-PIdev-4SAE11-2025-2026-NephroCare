@echo off
echo ========================================
echo  NephroCare PDF Generator Service
echo ========================================
echo.

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    echo.
    goto :end
)

echo ✅ Node.js found.

echo Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please reinstall Node.js.
    echo.
    goto :end
)

echo ✅ npm found.

echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies.
    echo    Try running: npm install --legacy-peer-deps
    echo.
    goto :end
)

echo ✅ Dependencies installed.

echo Starting PDF Generator Service...
echo 🌐 Service will be available at: http://localhost:4000
echo 📄 PDF reports available at: http://localhost:4000/api/reports
echo 📊 Health check at: http://localhost:4000/health
echo.

npm start

:end
echo.
echo Press any key to exit...
pause >nul