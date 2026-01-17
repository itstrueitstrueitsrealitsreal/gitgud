#!/bin/bash

# Test script for Docker containers
# Checks container status, backend health, and API endpoints

echo "=== GitGud Docker Container Tests ==="
echo ""

# Check if containers are running
echo "1. Checking container status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
    docker-compose ps
else
    echo "❌ Containers are not running"
    echo "Run: docker-compose up -d"
    exit 1
fi

echo ""
echo "2. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Backend health check passed"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

echo ""
echo "3. Testing backend API info endpoint..."
API_INFO=$(curl -s http://localhost:3000/)
if echo "$API_INFO" | grep -q "GitGud"; then
    echo "✅ Backend API is responding"
    echo "$API_INFO" | jq '.name' 2>/dev/null || echo "API Info received"
else
    echo "❌ Backend API not responding"
    echo "Response: $API_INFO"
fi

echo ""
echo "4. Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend returned status: $FRONTEND_RESPONSE"
fi

echo ""
echo "=== Test Summary ==="
echo "Frontend: http://localhost:80"
echo "Backend: http://localhost:3000"
echo "Backend Health: http://localhost:3000/health"
echo ""
echo "✅ All tests complete!"
