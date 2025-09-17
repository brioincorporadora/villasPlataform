# Villas Platform — Setup & Run Guide

Bem-vindo, mortal. Aqui vai o **passo‑a‑passo mínimo e direto** pra qualquer pessoa subir este projeto do zero em uma máquina nova usando Docker. Sem chororô.

> Stack resumida:
> - **Backend:** Django 5 + Wagtail 7 (Headless) + DRF
> - **Frontend:** Next.js (Node 20)
> - **DB:** PostgreSQL (via serviço `db` no Compose) — opcional usar DB externo
> - **Containers:** Docker Compose v2

---

## 🧰 Pré‑requisitos

- **Docker Desktop** (Windows/macOS) ou **Docker Engine** (Linux)
- **Docker Compose v2** (já vem no Docker Desktop)
- Windows: **WSL2** habilitado (Ubuntu recomendado)

Links úteis:
- Docker Desktop: https://www.docker.com/products/docker-desktop
- WSL2 (Windows): `wsl --install` (PowerShell como admin)

---

## 📦 Estrutura do projeto (esperada)

```
/ (raiz do repositório)
├─ docker-compose.yml
├─ .env                   # variáveis de ambiente (criar)
├─ backend/
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ cms/                # projeto Django/Wagtail (exemplo)
└─ frontend/
   ├─ Dockerfile
   ├─ package.json
   └─ package-lock.json   # gere localmente na 1ª vez (ver abaixo)
```

> Se o projeto Django ainda não existir, crie com `wagtail start cms /app/cms` de dentro do container do backend (ver Sec. “Primeira execução”).

---

## 🔐 Variáveis de Ambiente (`.env`)

Crie um arquivo **`.env`** na raiz, ao lado do `docker-compose.yml`.

### Usando o Postgres **do Compose** (serviço `db`)
```
DJANGO_SECRET_KEY=troque_isto
DJANGO_DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=postgres://postgres:postgres@db:5432/appdb
```

### Usando Postgres **externo** (por ex. já instalado no seu VPS)
```
DJANGO_SECRET_KEY=troque_isto
DJANGO_DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=postgres://USUARIO:SENHA@HOST:5432/NOME_DO_DB
```

> Dica: em Linux, dentro do container, `host.docker.internal` pode ser mapeado via `extra_hosts` no serviço.

---

## 🧱 Build dos containers

Na raiz do projeto:

```bash
docker compose build
```

- **backend** usa `python:3.13-slim` (com pacotes do sistema) e `psycopg[binary]` (psycopg3).
- **frontend** usa `node:20-alpine`.
- O **frontend** espera que exista **`package-lock.json`** para `npm ci`.
  - Se não existir, gere (ver seção abaixo).

---

## 🔁 Gerar o `package-lock.json` (só na 1ª vez)

Entre na pasta `frontend` e rode:

```bash
cd frontend
npm install --legacy-peer-deps
```

Isso cria **`package-lock.json`**. Depois você pode confiar em `npm ci` dentro do Docker.

> Adicione `frontend/.dockerignore` com:
> ```
> node_modules
> .next
> npm-debug.log
> ```

---

## ▶️ Subir os serviços

```bash
docker compose up -d
```

Verificar status:
```bash
docker compose ps
```

Ver logs de cada serviço:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

Acessos padrão:
- **Frontend (Next):** http://localhost:3000
- **Backend (Django/Wagtail):** http://localhost:8000

> Em dev, o Next roda com `next dev -H 0.0.0.0 -p 3000` para aceitar conexões externas ao container e manter HMR.

---

## 🧩 Primeira execução (Django/Wagtail)

Se o projeto Django já existe (ex.: `backend/cms`), pule para “Comandos úteis”.  
Se **ainda não existe**, crie pelo container:

```bash
# 1) criar estrutura Wagtail dentro de backend/cms
docker compose run --rm backend sh -lc "wagtail start cms /app/cms"

# 2) migrar banco e criar superusuário
docker compose exec backend sh -lc "cd cms && python manage.py migrate"
docker compose exec backend sh -lc "cd cms && python manage.py createsuperuser"
```

Colete estáticos (se o Dockerfile não fizer automaticamente):
```bash
docker compose exec backend sh -lc "cd cms && python manage.py collectstatic --noinput"
```

Abra o admin:
- http://localhost:8000/admin/

---

## 🧪 Comandos úteis (Django)

```bash
# Migrações
docker compose exec backend sh -lc "cd cms && python manage.py makemigrations"
docker compose exec backend sh -lc "cd cms && python manage.py migrate"

# Shell do Django
docker compose exec backend sh -lc "cd cms && python manage.py shell"

# Criar superusuário
docker compose exec backend sh -lc "cd cms && python manage.py createsuperuser"
```

---

## 🧱 Comandos úteis (Next.js)

```bash
# Instalar deps (fora do container, para gerar/atualizar lockfile)
cd frontend && npm install --legacy-peer-deps

# Rodar dentro do Docker (já sobe com o compose)
docker compose up -d frontend

# Logs do frontend
docker compose logs -f frontend
```

> Se estiver em Windows/WSL e o HMR não disparar, use no `docker-compose.yml` do `frontend`:
> ```yaml
> environment:
>   - CHOKIDAR_USEPOLLING=true
>   - WATCHPACK_POLLING=true
> volumes:
>   - ./frontend:/app
> ```

---

## 🛠️ Troubleshooting

- **Compose avisa** “the attribute `version` is obsolete”: remova `version: "3.x"` do `docker-compose.yml` (Compose v2 não precisa).
- **Erro npm `ERESOLVE` (peer deps)**: 
  - Atualize para `@tanstack/react-query@^5` **ou** use **React 18**.  
  - Em último caso apenas, use `--legacy-peer-deps`.
- **`npm ci` falha dizendo que não tem lockfile**: gere o `package-lock.json` local com `npm install` (ver seção acima).
- **psycopg2-binary falhando no Python 3.13**: usar **psycopg[binary] (v3)** no `requirements.txt`.
- **Sem acesso ao backend pelo navegador**: confira se o comando do backend está correto (ex.: `gunicorn cms.wsgi:application --bind 0.0.0.0:8000`) e se a porta está mapeada `8000:8000`.
- **Conexão com DB externo**: revise `DATABASE_URL` no `.env` e a rede (talvez mapear `host.docker.internal:host-gateway` no serviço).

---

## 🧹 Reset rápido (apagar tudo local)

```bash
docker compose down -v --rmi local
docker system prune -af
```

> Cuidado: remove volumes e imagens locais.

---

## 🚀 Produção (resumo)

- Backend com **Gunicorn** atrás de **Nginx** (proxy reverso).
- Frontend buildado com `next build` e servido com `next start` (ou estático se aplicável).
- Banco com backup/monitoramento; variáveis seguras; `DEBUG=False`; `ALLOWED_HOSTS` preenchido.
- Volume dedicado para `staticfiles/` e `media/`.

---

## 🧾 Scripts “one‑liner” (opcional)

```bash
# Subir tudo do zero
docker compose build && docker compose up -d && docker compose ps

# Ver logs agregados
docker compose logs -f
```

---

## ✅ Checklist de onboarding

1. Instalar Docker Desktop / Docker Engine
2. Clonar o repositório
3. Criar `.env` na raiz
4. Entrar em `frontend/` e rodar `npm install --legacy-peer-deps` (gera lockfile)
5. `docker compose build`
6. `docker compose up -d`
7. Migrar banco e criar superuser (se 1ª vez)
8. Abrir: http://localhost:3000 e http://localhost:8000/admin/
9. Ler “Troubleshooting” se der ruim

---

Qualquer dúvida: rode `docker compose ps` e `docker compose logs -f <serviço>` — traga o erro que a gente quebra no meio.
