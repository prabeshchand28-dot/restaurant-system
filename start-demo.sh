#!/bin/bash
# ──────────────────────────────────────────────
#  Uena Restaurant System — Demo Starter
# ──────────────────────────────────────────────

echo ""
echo "🍽️  Uena Restaurant System — Demo Mode"
echo "══════════════════════════════════════"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo ""
  echo "⚠️  ngrok install xaina. Internet share ko lagi:"
  echo "   brew install ngrok/ngrok/ngrok"
  echo "   (ya https://ngrok.com/download bata download garnus)"
  echo ""
fi

# Start server in background
echo "🚀 Server starting..."
node server.js &
SERVER_PID=$!

# Wait for server to be ready
sleep 2

# Get local IP
LOCAL_IP=$(node -e "
const os=require('os');
const nets=os.networkInterfaces();
for(const n of Object.keys(nets)){
  for(const i of nets[n]){
    if(i.family==='IPv4'&&!i.internal){process.stdout.write(i.address);process.exit();}
  }
}
process.stdout.write('localhost');
")

echo ""
echo "✅ Server ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 Same WiFi share:"
echo "     http://$LOCAL_IP:3000"
echo ""
echo "  🔑 Demo credentials:"
echo "     Username: demoowner"
echo "     Password: demo2026"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start ngrok if available
if command -v ngrok &> /dev/null; then
  echo ""
  echo "🌐 Starting ngrok (internet URL)..."
  ngrok http 3000 --log=stdout 2>&1 | while IFS= read -r line; do
    if echo "$line" | grep -q "url=https://"; then
      URL=$(echo "$line" | grep -oE 'url=https://[a-z0-9\-]+\.ngrok[^ ]*' | cut -d= -f2)
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  🌍 Internet URL (anyone can access):"
      echo "     $URL"
      echo ""
      echo "  👇 Yo link WhatsApp/Viber ma pathaunus:"
      echo "     $URL/login"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    echo "$line"
  done
else
  echo ""
  echo "📌 Internet bata access ko lagi (ngrok install garesi):"
  echo "   bash start-demo.sh"
  echo ""
  echo "Press Ctrl+C to stop server"
  wait $SERVER_PID
fi
