@echo off
title Push Code to GitHub
echo Pushing your Bible AI code to GitHub...
echo.
echo Please look for a GitHub login popup window!
echo.
git remote add origin https://github.com/Pappas-coder/BibleAI-App.git
git branch -M main
git push -u origin main
echo.
echo If you see "Branch 'main' set up to track remote branch 'main' from 'origin'", it was successful!
pause
