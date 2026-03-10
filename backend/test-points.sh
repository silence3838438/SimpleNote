#!/bin/bash

# 测试每日首次记账积分功能

API_BASE="https://api.qiannaqule.top/api"
ACCOUNT="17682824692"
PASSWORD="123456"

echo "========================================="
echo "🧪 测试每日首次记账积分功能"
echo "========================================="

# 1. 登录获取token
echo ""
echo "1️⃣ 登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/account-login" \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"$ACCOUNT\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo "✅ 登录成功"

# 2. 获取当前积分
echo ""
echo "2️⃣ 获取当前积分..."
POINTS_RESPONSE=$(curl -s -X POST "$API_BASE/billManager" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"action":"getPoints"}')

INITIAL_POINTS=$(echo $POINTS_RESPONSE | grep -o '"points":[0-9]*' | cut -d':' -f2)
echo "当前积分: $INITIAL_POINTS"

# 3. 创建账单
echo ""
echo "3️⃣ 创建测试账单..."
BILL_RESPONSE=$(curl -s -X POST "$API_BASE/billManager" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"action\":\"add\",\"data\":{\"amount\":99.99,\"type\":\"expense\",\"categoryId\":1,\"categoryName\":\"餐饮\",\"merchant\":\"测试商家\",\"remark\":\"测试积分\",\"date\":\"$(date +%Y-%m-%d)\"}}")

echo "$BILL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BILL_RESPONSE"

POINTS_AWARDED=$(echo $BILL_RESPONSE | grep -o '"pointsAwarded":[0-9]*' | cut -d':' -f2)
IS_DAILY_FIRST=$(echo $BILL_RESPONSE | grep -o '"isDailyFirst":[a-z]*' | cut -d':' -f2)
BILL_ID=$(echo $BILL_RESPONSE | grep -o '"_id":[0-9]*' | cut -d':' -f2)

echo ""
echo "获得积分: $POINTS_AWARDED"
echo "是否今日首次: $IS_DAILY_FIRST"

# 4. 验证积分
echo ""
echo "4️⃣ 验证积分增加..."
POINTS_RESPONSE=$(curl -s -X POST "$API_BASE/billManager" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"action":"getPoints"}')

CURRENT_POINTS=$(echo $POINTS_RESPONSE | grep -o '"points":[0-9]*' | cut -d':' -f2)
INCREASE=$((CURRENT_POINTS - INITIAL_POINTS))

echo "初始积分: $INITIAL_POINTS"
echo "当前积分: $CURRENT_POINTS"
echo "增加积分: $INCREASE"

# 5. 删除测试账单
if [ ! -z "$BILL_ID" ]; then
  echo ""
  echo "5️⃣ 清理测试数据..."
  curl -s -X POST "$API_BASE/billManager" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"action\":\"delete\",\"data\":{\"_id\":$BILL_ID}}" > /dev/null
  echo "✅ 测试账单已删除"
fi

# 6. 结果判断
echo ""
echo "========================================="
if [ "$INCREASE" -ge 2 ] && [ "$INCREASE" -le 7 ]; then
  echo "✅ 测试通过！积分增加 $INCREASE 分（预期2-7分）"
  if [ "$IS_DAILY_FIRST" = "true" ] && [ "$INCREASE" -eq 7 ]; then
    echo "🎉 今日首次记账，获得额外5积分！"
  fi
else
  echo "❌ 测试失败！积分增加 $INCREASE 分（预期2-7分）"
fi
echo "========================================="
