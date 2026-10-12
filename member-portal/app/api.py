from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from app.accounts import Accounts

STATIC_DIR = Path(__file__).parent / "static"


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


# New accounts get stricter rules than login, which has to keep accepting whatever already exists
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64, pattern=r"^\s*[A-Za-z0-9._-]+\s*$")
    password: str = Field(min_length=8, max_length=256)


class MemberOut(BaseModel):
    username: str
    name: str


# Builds the app without starting a server, so tests can run it in-process with their own accounts
def create_app(accounts: Accounts | None = None) -> FastAPI:
    accounts = accounts or Accounts()
    app = FastAPI(title="Member Portal", version="1.0.0")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # The same message for a wrong username and a wrong password, so it never reveals which accounts exist
    @app.post("/api/login", response_model=MemberOut)
    def login(body: LoginRequest):
        member = accounts.check_login(body.username, body.password)
        if member is None:
            raise HTTPException(status_code=401, detail="Incorrect username or password.")
        return member

    @app.post("/api/register", response_model=MemberOut, status_code=201)
    def register(body: RegisterRequest):
        member = accounts.register(body.username, body.password)
        if member is None:
            raise HTTPException(status_code=409, detail="That username is already taken.")
        return member

    # Anything else under /api is a 404 rather than a fall through to the front end
    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
    def unknown_api_route(path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app
