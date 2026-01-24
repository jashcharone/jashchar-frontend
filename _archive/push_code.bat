@echo off
echo Initializing Git Repository...
git init
git add .
git commit -m "Complete Front CMS Implementation"
git branch -M main
git remote add origin https://github.com/Abhishekb2019/jashcharerp.git
git push -u origin main
pause