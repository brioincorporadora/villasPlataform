# Usando a imagem oficial do Python
FROM python:3.13-slim

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /villasPlataform

# Instalar dependências do sistema (necessário para pacotes como psycopg2, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    zlib1g-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libxml2-dev \
    libxslt1-dev \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar o arquivo requirements.txt para dentro do contêiner
COPY villasPlataform/requirements.txt /villasPlataform/

# Instalar as dependências do projeto
RUN pip install --no-cache-dir -r /villasPlataform/requirements.txt

# Copiar o código do projeto para dentro do contêiner
COPY villasPlataform /villasPlataform/

# Expor a porta onde o servidor Django vai rodar
EXPOSE 8000

# Rodar o servidor Django (para desenvolvimento)
CMD ["python", "/villasPlataform/manage.py", "runserver", "0.0.0.0:8000"]
