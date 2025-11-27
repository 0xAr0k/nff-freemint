# API Endpoints - cURL Examples

This document provides cURL examples for all endpoints in the Code Redemption System.

## 🔧 Environment Variables

```bash
# Set these variables for easier testing
export SERVER_URL="http://localhost:3000"
export ADMIN_SECRET="DhlNWE3YjliMDA0NWU4OTFlY2RkZGUzZGNhYm"
export CLEAR_DATA_SECRET="GUzZGNhYmY0NHAyMTQ4Nzk"
```

---

## 📋 Public Endpoints (No Authentication Required)

### Health Check
```bash
curl -X GET $SERVER_URL/
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "nff-code-redeemer"
}
```

### Check Code Validity
```bash
# Check if a code exists and has uses remaining
curl -X GET "$SERVER_URL/check?code=EARLY_ACCESS"
```

**Expected Response (Valid Code):**
```json
{
  "valid": true,
  "code": "EARLY_ACCESS",
  "usesRemaining": 95
}
```

**Expected Response (Invalid/Depleted Code):**
```json
{
  "valid": false,
  "error": "Code not found"
}
```

### Redeem Code
```bash
# Redeem a code with user information
curl -X POST $SERVER_URL/use \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EARLY_ACCESS",
    "x_handle": "@nft_collector",
    "eth_address": "0x742d35Cc6634C0532925a3b8D6Ac5a5CE1A2e7b8"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "code": "EARLY_ACCESS",
  "remainingUses": 94,
  "data": {
    "x_handle": "@nft_collector",
    "eth_address": "0x742d35cc6634c0532925a3b8d6ac5a5ce1a2e7b8",
    "timestamp": "2025-11-15T10:30:45.123Z"
  }
}
```

**Expected Response (Error):**
```json
{
  "error": "This ETH address has already redeemed a code",
  "previousCode": "EARLY_ACCESS",
  "previousTimestamp": "2025-11-15T09:15:30.456Z"
}
```

---

## 🔐 Admin Endpoints (Require Authorization)

### Test Redis Connection
```bash
curl -X GET $SERVER_URL/test-redis \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Redis connection working",
  "testValue": "test-value",
  "storage": "redis"
}
```

### Create New Code
```bash
# Add a new redemption code
curl -X POST $SERVER_URL/codes \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EARLY_ACCESS",
    "uses": 100
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "code": "EARLY_ACCESS",
  "uses": 100
}
```

### Get All Records
```bash
# Retrieve all codes, usages, ETH addresses, and rate limits
curl -X GET $SERVER_URL/records \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

**Expected Response:**
```json
{
  "codes": [
    {
      "code": "EARLY_ACCESS",
      "uses": 95
    }
  ],
  "usages": [
    {
      "code": "EARLY_ACCESS",
      "timestamp": "2025-11-15T10:30:45.123Z",
      "x_handle": "@nft_collector",
      "eth_address": "0x742d35cc6634c0532925a3b8d6ac5a5ce1a2e7b8",
      "ip": "192.168.1.100"
    }
  ],
  "ethAddresses": [
    {
      "eth_address": "0x742d35cc6634c0532925a3b8d6ac5a5ce1a2e7b8",
      "code": "EARLY_ACCESS",
      "timestamp": "2025-11-15T10:30:45.123Z",
      "x_handle": "@nft_collector"
    }
  ],
  "rateLimits": [
    {
      "ip": "192.168.1.100",
      "lastSubmission": "2025-11-15T10:30:45.123Z"
    }
  ],
  "stats": {
    "totalCodes": 1,
    "totalUsages": 1,
    "uniqueEthAddresses": 1,
    "activeRateLimits": 1
  }
}
```

### Clear All Data (Destructive - Requires Special Secret)
```bash
# ⚠️ DESTRUCTIVE: Permanently deletes all data
curl -X POST $SERVER_URL/flush \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "clearDataSecret": "'$CLEAR_DATA_SECRET'"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleared 15 keys with clear data secret authentication",
  "stats": {
    "codes": 3,
    "usages": 8,
    "ethAddresses": 8,
    "rateLimits": 2,
    "other": 0
  },
  "totalKeysCleared": 15
}
```

---

## 🌐 Dashboard Endpoints

### Access Dashboard (HTTP Basic Auth Required)
```bash
# Access the web dashboard (requires HTTP Basic Auth)
curl -X GET $SERVER_URL/dashboard \
  -u "admin:$ADMIN_SECRET"
```

**Note:** The dashboard is best accessed via web browser at `http://localhost:3000/dashboard`
- Username: `admin`
- Password: Your `ADMIN_SECRET` value

---

## 📝 Common Error Responses

### Missing Authorization
```json
{
  "error": "Unauthorized"
}
```

### Invalid JSON
```json
{
  "error": "Invalid JSON in request body"
}
```

### Missing Required Fields
```json
{
  "error": "Missing code or uses"
}
```

### Invalid ETH Address
```json
{
  "error": "Invalid eth_address format"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "You can only submit once per 24 hours. Try again in 18 hours.",
  "lastSubmission": "2025-11-14T16:30:45.123Z",
  "hoursLeft": 18
}
```

### Code Not Found
```json
{
  "error": "Code not found"
}
```

### Code Depleted
```json
{
  "error": "Code has no uses remaining"
}
```

### ETH Address Already Used
```json
{
  "error": "This ETH address has already redeemed a code",
  "previousCode": "EARLY_ACCESS",
  "previousTimestamp": "2025-11-15T09:15:30.456Z"
}
```

### Invalid Clear Data Secret
```json
{
  "error": "Invalid clear data secret. This operation requires additional authentication."
}
```

---

## 🚀 Testing Workflow

### 1. Basic Setup Test
```bash
# 1. Check server health
curl -X GET $SERVER_URL/

# 2. Test Redis connection
curl -X GET $SERVER_URL/test-redis -H "Authorization: Bearer $ADMIN_SECRET"
```

### 2. Create and Test Codes
```bash
# 1. Create a test code
curl -X POST $SERVER_URL/codes \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST_CODE", "uses": 5}'

# 2. Check the code
curl -X GET "$SERVER_URL/check?code=TEST_CODE"

# 3. Redeem the code
curl -X POST $SERVER_URL/use \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST_CODE",
    "x_handle": "@test_user",
    "eth_address": "0x1234567890123456789012345678901234567890"
  }'
```

### 3. View and Manage Data
```bash
# 1. View all records
curl -X GET $SERVER_URL/records -H "Authorization: Bearer $ADMIN_SECRET"

# 2. Try to redeem with same ETH address (should fail)
curl -X POST $SERVER_URL/use \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST_CODE",
    "x_handle": "@another_user",
    "eth_address": "0x1234567890123456789012345678901234567890"
  }'
```

### 4. Cleanup (Optional)
```bash
# Clear all test data (DESTRUCTIVE)
curl -X POST $SERVER_URL/flush \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"clearDataSecret": "'$CLEAR_DATA_SECRET'"}'
```

---

## 📊 HTTP Status Codes

| Status | Meaning | When It Occurs |
|--------|---------|----------------|
| 200 | OK | Successful operation |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid/missing admin secret |
| 403 | Forbidden | Invalid clear data secret |
| 404 | Not Found | Code doesn't exist |
| 429 | Too Many Requests | Rate limit or concurrent processing |
| 500 | Internal Server Error | System/Redis error |

---

## 💡 Tips

1. **Environment Variables**: Set the environment variables at the top for easier testing
2. **JSON Formatting**: Use tools like `jq` to format JSON responses: `curl ... | jq`
3. **Testing**: Start with health check and admin endpoints before testing user flows
4. **Error Handling**: Check HTTP status codes to understand different error scenarios
5. **Rate Limiting**: Each IP can only submit once per 24 hours
6. **ETH Addresses**: Must be valid format and are case-insensitive for duplicate checking
7. **Dashboard**: Use web browser for easier administration via the dashboard interface