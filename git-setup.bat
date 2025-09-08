@echo off
echo Starting Git setup for AI Playwright Test Generator...
echo.

echo Step 1: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo ERROR: Git init failed
    pause
    exit /b 1
)
echo SUCCESS: Git repository initialized
echo.

echo Step 2: Checking Git status...
git status
echo.

echo Step 3: Adding all files to staging...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Git add failed
    pause
    exit /b 1
)
echo SUCCESS: All files staged
echo.

echo Step 4: Verifying staged files...
git status
echo.

echo Step 5: Creating initial commit...
git commit -m "feat: AI-powered Playwright test generator for Experian - Multi-agent AI pipeline (Agents A, B, C, G) for intelligent test generation - LangChain integration supporting OpenAI/Anthropic/Ollama providers - RAG system with Experian-specific UI selectors and API endpoints - Microsoft Playwright MCP integration for real-time syntax validation - Page Object Model implementation for maintainable test architecture - Visual debugging with element highlighting and headed mode execution - Automated quality analysis and engineer review reports - Cross-browser testing (Chromium, Firefox, WebKit) and mobile responsiveness - Natural language to TypeScript test conversion - Comprehensive documentation with interactive architecture diagrams"
if %errorlevel% neq 0 (
    echo ERROR: Git commit failed
    pause
    exit /b 1
)
echo SUCCESS: Initial commit created
echo.

echo Step 6: Adding remote repository...
git remote add origin https://github.com/srirachajones/ai-playwright-test-generator.git
if %errorlevel% neq 0 (
    echo WARNING: Remote add failed - repository might already exist or URL might be wrong
)
echo.

echo Step 7: Verifying remote...
git remote -v
echo.

echo Step 8: Pushing to GitHub...
echo NOTE: You may need to authenticate with GitHub
git push -u origin main
if %errorlevel% neq 0 (
    echo ERROR: Git push failed
    echo This could be due to:
    echo - Repository doesn't exist on GitHub
    echo - Authentication required
    echo - Branch name mismatch (try 'git push -u origin master')
    pause
    exit /b 1
)
echo SUCCESS: Repository pushed to GitHub!
echo.

echo Step 9: Final verification...
git status
echo.

echo ========================================
echo Git setup completed successfully!
echo Your repository should now be available at:
echo https://github.com/srirachajones/ai-playwright-test-generator
echo ========================================
pause
