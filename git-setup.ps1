# AI Playwright Test Generator - Git Setup Script
Write-Host "Starting Git setup for AI Playwright Test Generator..." -ForegroundColor Green
Write-Host ""

# Step 1: Initialize Git
Write-Host "Step 1: Initializing Git repository..." -ForegroundColor Yellow
try {
    git init
    Write-Host "SUCCESS: Git repository initialized" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git init failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check status
Write-Host "Step 2: Checking Git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Step 3: Add all files
Write-Host "Step 3: Adding all files to staging..." -ForegroundColor Yellow
try {
    git add .
    Write-Host "SUCCESS: All files staged" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git add failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Verify staged files
Write-Host "Step 4: Verifying staged files..." -ForegroundColor Yellow
git status
Write-Host ""

# Step 5: Create commit
Write-Host "Step 5: Creating initial commit..." -ForegroundColor Yellow
$commitMessage = @"
feat: AI-powered Playwright test generator for Experian

- Multi-agent AI pipeline (Agents A, B, C, G) for intelligent test generation
- LangChain integration supporting OpenAI/Anthropic/Ollama providers
- RAG system with Experian-specific UI selectors and API endpoints
- Microsoft Playwright MCP integration for real-time syntax validation
- Page Object Model implementation for maintainable test architecture
- Visual debugging with element highlighting and headed mode execution
- Automated quality analysis and engineer review reports
- Cross-browser testing (Chromium, Firefox, WebKit) and mobile responsiveness
- Natural language to TypeScript test conversion
- Comprehensive documentation with interactive architecture diagrams

Transforms user stories like 'User signs in to Experian account' into 
production-ready Playwright test suites with error handling and best practices.
"@

try {
    git commit -m $commitMessage
    Write-Host "SUCCESS: Initial commit created" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git commit failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Add remote
Write-Host "Step 6: Adding remote repository..." -ForegroundColor Yellow
try {
    git remote add origin https://github.com/srirachajones/ai-playwright-test-generator.git
    Write-Host "SUCCESS: Remote repository added" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Remote add failed - repository might already exist" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Verify remote
Write-Host "Step 7: Verifying remote..." -ForegroundColor Yellow
git remote -v
Write-Host ""

# Step 8: Push to GitHub
Write-Host "Step 8: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "NOTE: You may need to authenticate with GitHub" -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "SUCCESS: Repository pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git push failed" -ForegroundColor Red
    Write-Host "This could be due to:" -ForegroundColor Yellow
    Write-Host "- Repository doesn't exist on GitHub yet" -ForegroundColor Yellow
    Write-Host "- Authentication required" -ForegroundColor Yellow
    Write-Host "- Branch name mismatch (try 'git push -u origin master')" -ForegroundColor Yellow
    
    # Try with master branch if main fails
    Write-Host "Trying with master branch..." -ForegroundColor Yellow
    try {
        git push -u origin master
        Write-Host "SUCCESS: Repository pushed to GitHub with master branch!" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: Both main and master branches failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 9: Final verification
Write-Host "Step 9: Final verification..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Git setup completed successfully!" -ForegroundColor Green
Write-Host "Your repository should now be available at:" -ForegroundColor Green
Write-Host "https://github.com/srirachajones/ai-playwright-test-generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green

Read-Host "Press Enter to exit"
