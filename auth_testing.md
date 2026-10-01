# Auth Testing — Office do Léo

Admin: leo@officedoleo.com / Leo@Office2026 (seeded from backend/.env on startup)
Endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/refresh
Cookies: httpOnly access_token (15 min) + refresh_token (7d), SameSite=None, Secure.
Brute force: 5 fails -> 15 min lockout (login_attempts collection).

## Test
curl -c cookies.txt -X POST $API_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"leo@officedoleo.com","password":"Leo@Office2026"}'
curl -b cookies.txt $API_URL/api/auth/me
