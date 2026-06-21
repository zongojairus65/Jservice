# ─── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy source (go.sum is generated below — it isn't committed to the repo)
COPY . .
RUN go mod tidy

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o server ./cmd/server

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./server"]