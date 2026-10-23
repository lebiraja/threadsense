FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
# wheels are pre-downloaded on the host (pip download): campus DNS blocks the build container
COPY wheels ./wheels
RUN pip install --no-cache-dir --no-index --find-links wheels -r requirements.txt
COPY *.py ./
HEALTHCHECK --interval=10s --timeout=5s --retries=6 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/api/overview')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
