#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Sales Dialpad - Deployment Script${NC}\n"

# Check git status
echo -e "${YELLOW}1. Checking git status...${NC}"
git status

echo -e "\n${YELLOW}2. Adding all changes...${NC}"
git add .

echo -e "\n${YELLOW}3. Creating commit...${NC}"
git commit -m "feat: redesign dashboard with persistent call state and call forwarding

- Replace separate /dialpad and /history pages with unified /dashboard
- Add tabbed navigation (Dialer, Call Logs, Incoming Calls, Recordings)
- Implement call forwarding API and configuration UI
- Fix issue where active calls disconnect on tab navigation
- Add mobile-responsive design with bottom navigation on small screens
- Implement date filtering for call logs and recordings
- Improve UI with professional styling and status indicators"

echo -e "\n${YELLOW}4. Pushing to remote...${NC}"
git push origin v0/tantitommy3-4371-79869e8d

echo -e "\n${GREEN}✅ Changes pushed successfully!${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Go to: https://github.com/tantichandan/salesdialpad"
echo "2. Create a Pull Request from v0/tantitommy3-4371-79869e8d → main"
echo "3. Review and merge the PR"
echo "4. Vercel will automatically deploy your changes"
echo ""
echo -e "${GREEN}Your live app will be updated within 1-2 minutes!${NC}"
