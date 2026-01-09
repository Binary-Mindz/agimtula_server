#!/bin/bash

# Role-Based Permission System - Quick Test Script
# এই script দিয়ে আপনি quickly test করতে পারবেন

echo "🚀 Role-Based Permission System - Quick Test"
echo "=============================================="
echo ""

API_URL="http://localhost:3000"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Note: আপনার ADMIN TOKEN দিয়ে $ADMIN_TOKEN replace করুন${NC}"
echo ""

# Test 1: সব roles-এর সব permissions দেখুন
echo -e "${GREEN}Test 1: সব Roles-এর সব Permissions দেখুন${NC}"
echo "Command: GET /permissions/roles/all"
echo ""
curl -X GET "$API_URL/permissions/roles/all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "❌ Failed"
echo ""
echo "---"
echo ""

# Test 2: USER role-এর permissions দেখুন
echo -e "${GREEN}Test 2: USER Role-এর Permissions${NC}"
echo "Command: GET /permissions/roles/USER/modules"
echo ""
curl -X GET "$API_URL/permissions/roles/USER/modules" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "❌ Failed"
echo ""
echo "---"
echo ""

# Test 3: USER role-কে 'payments' permission দিন
echo -e "${GREEN}Test 3: USER Role-কে 'payments' Permission দিন${NC}"
echo "Command: POST /permissions/roles/USER/modules/payments/assign"
echo ""
curl -X POST "$API_URL/permissions/roles/USER/modules/payments/assign" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "❌ Failed"
echo ""
echo "---"
echo ""

# Test 4: ACCOUNTANT role-এর permissions দেখুন
echo -e "${GREEN}Test 4: ACCOUNTANT Role-এর Permissions${NC}"
echo "Command: GET /permissions/roles/ACCOUNTANT/modules"
echo ""
curl -X GET "$API_URL/permissions/roles/ACCOUNTANT/modules" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "❌ Failed"
echo ""
echo "---"
echo ""

# Test 5: USER role থেকে 'mileage' permission রিভোক করুন
echo -e "${GREEN}Test 5: USER Role থেকে 'mileage' Permission রিভোক${NC}"
echo "Command: DELETE /permissions/roles/USER/modules/mileage/revoke"
echo ""
curl -X DELETE "$API_URL/permissions/roles/USER/modules/mileage/revoke" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "❌ Failed"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}✅ Tests completed!${NC}"
echo ""
echo "📝 Manual Testing:"
echo "1. Login as USER"
echo "2. Try accessing 'invoices' endpoint - should work (has permission)"
echo "3. Try accessing 'payments' endpoint - should work (just assigned)"
echo "4. Try accessing 'mileage' endpoint - should fail (revoked)"
echo "5. Try accessing 'users' endpoint - should fail (no permission)"
