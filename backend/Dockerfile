FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user --default-timeout=100 --retries 5 -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies (forced refresh for fonts)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-noto-extra \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

# Copy from builder
COPY --from=builder /root/.local /home/appuser/.local
COPY . .

# Create a non-root user and required directories
RUN useradd -m appuser && \
    mkdir -p /app/uploads && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /home/appuser
USER appuser

# Update PATH and Cache
ENV PATH=/home/appuser/.local/bin:$PATH
ENV HOME=/home/appuser
ENV XDG_CACHE_HOME=/tmp/.cache
ENV TRANSFORMERS_CACHE=/tmp/.cache
ENV HF_HOME=/tmp/.cache

# Create writable cache directory in tmp
RUN mkdir -p /tmp/.cache && chown -R appuser:appuser /tmp/.cache

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
