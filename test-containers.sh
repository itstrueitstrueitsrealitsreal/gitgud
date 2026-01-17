#!/bin/bash

echo "🧪 Testing GitGud Docker Containers..."
echo ""

echo "1️⃣  Checking container status..."
docker-compose ps
echo ""

echo "2️⃣  Testing backend health endpoint..."
curl -s http://localhost:3000/health 2>/dev/null && echo "" || echo "❌ Backend not responding"
echo ""

echo "3️⃣  Testing backend API info..."
curl -s http://localhost:3000/ 2>/dev/null | head -c 200 && echo "..." || echo "❌ Backend API not responding"
echo ""

echo "✅ Quick test complete!"
echo ""
echo "🌐 Frontend: http://localhost:80"
echo "🔧 Backend:  http://localhost:3000"
echo "📊 Health:   http://localhost:3000/health"
