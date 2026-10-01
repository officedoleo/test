from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Annotated, Optional, List
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import os, re, ipaddress, logging, uuid, httpx, bcrypt, jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

TZ = ZoneInfo("America/Sao_Paulo")
SLOT_HOURS = list(range(8, 21))
SLOT_TIMES = [f"{h:02d}:00" for h in SLOT_HOURS]
JWT_ALGORITHM = "HS256"
BRAND = "Office do Léo"

SERVICES = [
    {
        "category_id": "aulas", "category_name": "Aulas", "price_per_hour": 60,
        "items": [
            {"id": "aula-excel", "name": "Excel"},
            {"id": "aula-word", "name": "Word"},
            {"id": "aula-power-bi", "name": "Power BI"},
            {"id": "aula-power-point", "name": "PowerPoint"},
        ],
    },
    {
        "category_id": "consultorias", "category_name": "Consultorias", "price_per_hour": 100,
        "items": [
            {"id": "cons-empresarial", "name": "Consultoria Empresarial"},
            {"id": "cons-excel", "name": "Excel"},
            {"id": "cons-power-bi", "name": "Power BI"},
            {"id": "cons-power-point", "name": "PowerPoint"},
            {"id": "cons-word", "name": "Word"},
            {"id": "cons-financeiro", "name": "Financeiro"},
            {"id": "cons-planejamento", "name": "Planejamento Estratégico"},
        ],
    },
    {
        "category_id": "palestras", "category_name": "Palestras", "price_per_hour": 120,
        "items": [
            {"id": "palestra-tecnologia", "name": "Palestra de Tecnologia"},
            {"id": "palestra-gestao", "name": "Palestra de Pensamento de Gestão"},
        ],
    },
]

# ---------------- Models ----------------
PyObjectId = Annotated[str, BeforeValidator(str)]

class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        if not doc:
            return None
        d = dict(doc)
        d["id"] = str(d.pop("_id"))
        return cls(**d)

    def to_mongo(self):
        d = self.model_dump(by_alias=True)
        if not d.get("_id"):
            d.pop("_id", None)
        return d

class Booking(BaseDocument):
    booking_code: str = Field(default_factory=lambda: "ODL-" + uuid.uuid4().hex[:6].upper())
    service_id: str
    service_name: str
    category_id: str
    category_name: str
    price_per_hour: float
    date: str
    time: str
    name: str
    email: str
    phone: str
    notes: str = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingCreate(BaseModel):
    service_id: str
    date: str
    time: str
    name: str
    email: str
    phone: str
    notes: str = ""

class BlockCreate(BaseModel):
    date: str
    time: str

class StatusUpdate(BaseModel):
    status: str

class SettingsUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    owner_email: Optional[str] = None

class LoginIn(BaseModel):
    email: str
    password: str

# ---------------- Helpers ----------------
logger = logging.getLogger(__name__)

def now_local():
    return datetime.now(TZ)

def parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Data inválida (use AAAA-MM-DD)")

def date_br(iso: str) -> str:
    d = datetime.strptime(iso, "%Y-%m-%d")
    return d.strftime("%d/%m/%Y")

def find_service(service_id: str):
    for cat in SERVICES:
        for item in cat["items"]:
            if item["id"] == service_id:
                return cat, item
    return None, None

async def build_slots(d):
    iso = d.isoformat()
    bookings = await db.bookings.find({"date": iso, "status": {"$ne": "cancelled"}}).to_list(300)
    by_time = {}
    for b in bookings:
        by_time.setdefault(b["time"], b)
    blocks = {b["time"]: b for b in await db.slot_blocks.find({"date": iso}).to_list(300)}
    now = now_local()
    out = []
    for h in SLOT_HOURS:
        t = f"{h:02d}:00"
        slot_dt = datetime(d.year, d.month, d.day, h, tzinfo=TZ)
        if slot_dt <= now:
            status = "past"
        elif t in blocks:
            status = "blocked"
        elif t in by_time:
            status = "booked"
        else:
            status = "available"
        b = by_time.get(t)
        out.append({
            "time": t, "status": status,
            "booking": ({"name": b["name"], "service_name": b["service_name"], "phone": b["phone"]} if (status == "booked" and b) else None),
        })
    return out

async def get_setting(key, default=None):
    doc = await db.settings.find_one({"key": key})
    return doc["value"] if doc else default

async def set_setting(key, value):
    await db.settings.update_one(
        {"key": key},
        {"$set": {"value": value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

# ---------------- Email (Emergent managed Resend) ----------------
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")

async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")

def booking_email_html(b: dict) -> str:
    rows = [
        ("Serviço", b["service_name"]),
        ("Categoria", b["category_name"]),
        ("Valor", f"R$ {b['price_per_hour']:.0f} / hora"),
        ("Data", f"{date_br(b['date'])} às {b['time']} (horário de Brasília)"),
        ("Cliente", b["name"]),
        ("Contato", f"{b['phone']} &middot; {b['email']}"),
        ("Código", b["booking_code"]),
    ]
    if b.get("notes"):
        rows.append(("Observações", b["notes"]))
    tr = "".join(
        f'<tr>'
        f'<td style="padding:8px 16px 8px 0;color:#64748B;font-size:13px;text-transform:uppercase;letter-spacing:1px">{escape(k)}</td>'
        f'<td style="padding:8px 0;color:#0F172A;font-size:15px;font-weight:600">{escape(v)}</td>'
        f'</tr>' for k, v in rows
    )
    return (
        '<table role="presentation" width="100%" style="background:#F1F5F9;padding:24px">'
        '<tr><td><table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px">'
        '<tr><td style="padding:28px 32px 8px 32px;font-family:Arial,sans-serif">'
        f'<p style="margin:0;font-size:13px;letter-spacing:2px;color:#05B863;font-weight:700">NOVO AGENDAMENTO</p>'
        f'<h1 style="margin:8px 0 4px;font-size:22px;color:#0F172A">{escape(EMAIL_FROM_NAME)}</h1>'
        '</td></tr>'
        f'<tr><td style="padding:8px 32px 16px 32px;font-family:Arial,sans-serif"><table role="presentation" width="100%">{tr}</table></td></tr>'
        '<tr><td style="padding:12px 32px 28px 32px;font-family:Arial,sans-serif">'
        '<p style="margin:0;font-size:12px;color:#888">Enviado automaticamente pelo sistema de agendamento de '
        f'{escape(EMAIL_FROM_NAME)}. Nunca pedimos senha ou dados de cartão por e-mail.</p>'
        '</td></tr></table></td></tr></table>'
    )

# ---------------- Auth ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, user_id: str):
    response.set_cookie(key="access_token", value=create_access_token(user_id), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")

async def require_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.admin_users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return {"id": str(user["_id"]), "email": user["email"], "role": user.get("role", "admin")}

async def ensure_not_locked(identifier: str):
    att = await db.login_attempts.find_one({"identifier": identifier})
    if att and att.get("locked_until"):
        if datetime.fromisoformat(att["locked_until"]) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em alguns minutos.")

async def register_fail(identifier: str):
    att = await db.login_attempts.find_one({"identifier": identifier})
    if att:
        count = att.get("count", 0) + 1
        update = {"count": count}
        if count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            update["count"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update})
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1})

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.admin_users.find_one({"email": admin_email})
    if existing is None:
        await db.admin_users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Léo", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.admin_users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

# ---------------- App & Routes ----------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": f"{BRAND} API online", "services": len(SERVICES)}

@api_router.get("/config")
async def get_config():
    return {
        "brand_name": BRAND,
        "whatsapp_number": await get_setting("whatsapp_number", os.environ.get("WHATSAPP_NUMBER", "")),
    }

@api_router.get("/services")
async def get_services():
    return SERVICES

@api_router.get("/availability")
async def get_availability(date: str):
    d = parse_date(date)
    return {"date": d.isoformat(), "slots": await build_slots(d)}

@api_router.post("/bookings", status_code=201)
async def create_booking(input: BookingCreate):
    cat, item = find_service(input.service_id)
    if not item:
        raise HTTPException(status_code=422, detail="Serviço inválido")
    d = parse_date(input.date)
    if d < now_local().date():
        raise HTTPException(status_code=422, detail="Não é possível agendar em datas passadas")
    if input.time not in SLOT_TIMES:
        raise HTTPException(status_code=422, detail="Horário inválido")
    name = input.name.strip()
    phone = input.phone.strip()
    email = input.email.strip().lower()
    if not name or not phone or not email:
        raise HTTPException(status_code=422, detail="Preencha nome, WhatsApp e e-mail")
    slots = {s["time"]: s for s in await build_slots(d)}
    st = slots[input.time]["status"]
    if st == "past":
        raise HTTPException(status_code=409, detail="Este horário já passou")
    if st == "blocked":
        raise HTTPException(status_code=409, detail="Este horário está bloqueado. Escolha outro.")
    if st == "booked":
        raise HTTPException(status_code=409, detail="Este horário acabou de ser reservado. Escolha outro.")
    booking = Booking(
        service_id=item["id"], service_name=item["name"],
        category_id=cat["category_id"], category_name=cat["category_name"],
        price_per_hour=cat["price_per_hour"],
        date=d.isoformat(), time=input.time,
        name=name, email=email, phone=phone, notes=input.notes.strip(),
    )
    await db.bookings.insert_one(booking.to_mongo())
    owner = await get_setting("owner_email")
    if owner:
        try:
            await send_email(
                to=owner,
                subject=f"Novo agendamento · {item['name']} · {date_br(d.isoformat())} {input.time}",
                html=booking_email_html(booking.model_dump()),
            )
        except Exception as e:
            logger.error(f"Booking email not sent: {e}")
    return {"booking": booking.model_dump()}

# ---- Admin: auth ----
@api_router.post("/auth/login")
async def login(input: LoginIn, request: Request, response: Response):
    email = input.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    ident = f"{ip}:{email}"
    await ensure_not_locked(ident)
    user = await db.admin_users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await register_fail(ident)
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    await db.login_attempts.delete_one({"identifier": ident})
    set_auth_cookies(response, str(user["_id"]))
    return {"id": str(user["_id"]), "email": email, "role": user.get("role", "admin")}

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Sem sessão")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError()
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    user = await db.admin_users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    set_auth_cookies(response, str(user["_id"]))
    return {"ok": True}

@api_router.get("/auth/me")
async def me(admin=Depends(require_admin)):
    return admin

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

# ---- Admin: bookings ----
@api_router.get("/admin/bookings")
async def admin_bookings(admin=Depends(require_admin), status: Optional[str] = None, date: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    if date:
        q["date"] = date
    docs = await db.bookings.find(q).sort([("date", 1), ("time", 1)]).to_list(500)
    return [Booking.from_mongo(d).model_dump() for d in docs]

@api_router.patch("/admin/bookings/{booking_id}")
async def update_booking(booking_id: str, input: StatusUpdate, admin=Depends(require_admin)):
    if input.status not in {"pending", "confirmed", "cancelled"}:
        raise HTTPException(status_code=422, detail="Status inválido")
    res = await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": input.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"ok": True, "status": input.status}

@api_router.delete("/admin/bookings/{booking_id}")
async def delete_booking(booking_id: str, admin=Depends(require_admin)):
    res = await db.bookings.delete_one({"_id": booking_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"ok": True}

# ---- Admin: slots ----
@api_router.get("/admin/slots")
async def admin_slots(date: str, admin=Depends(require_admin)):
    d = parse_date(date)
    return {"date": d.isoformat(), "slots": await build_slots(d)}

@api_router.post("/admin/slots/block")
async def block_slot(input: BlockCreate, admin=Depends(require_admin)):
    d = parse_date(input.date)
    if input.time not in SLOT_TIMES:
        raise HTTPException(status_code=422, detail="Horário inválido")
    existing = await db.slot_blocks.find_one({"date": d.isoformat(), "time": input.time})
    if not existing:
        await db.slot_blocks.insert_one({
            "date": d.isoformat(), "time": input.time,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"ok": True}

@api_router.post("/admin/slots/unblock")
async def unblock_slot(input: BlockCreate, admin=Depends(require_admin)):
    d = parse_date(input.date)
    if input.time not in SLOT_TIMES:
        raise HTTPException(status_code=422, detail="Horário inválido")
    await db.slot_blocks.delete_many({"date": d.isoformat(), "time": input.time})
    return {"ok": True}

# ---- Admin: settings ----
@api_router.get("/admin/settings")
async def admin_get_settings(admin=Depends(require_admin)):
    return {
        "whatsapp_number": await get_setting("whatsapp_number", os.environ.get("WHATSAPP_NUMBER", "")),
        "owner_email": await get_setting("owner_email", ""),
    }

@api_router.put("/admin/settings")
async def admin_update_settings(input: SettingsUpdate, admin=Depends(require_admin)):
    if input.whatsapp_number is not None:
        digits = re.sub(r"\D", "", input.whatsapp_number)
        if len(digits) < 10:
            raise HTTPException(status_code=422, detail="Número de WhatsApp inválido (inclua o código do país)")
        await set_setting("whatsapp_number", digits)
    if input.owner_email is not None:
        await set_setting("owner_email", input.owner_email.strip().lower())
    return {"ok": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',')],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("startup")
async def startup():
    await seed_admin()
    await db.admin_users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
