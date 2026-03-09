# Build context: project root (betix/)
FROM python:3.12-slim

WORKDIR /app

COPY core/requirements.txt core/requirements.txt
RUN pip install --no-cache-dir -r core/requirements.txt

COPY core/ core/

ENV CORE_PORT=5000
EXPOSE 5000

CMD ["python", "-m", "core.main"]
