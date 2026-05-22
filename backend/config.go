package config

import (
	"fmt"
	"os"
)

type Config struct {
	Env         string
	Port        string
	DatabaseURL string
	JWTSecret   string
	JWTExpiry   string
	FrontendURL string
	WANumber    string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
}

func Load() *Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("DB_USER", "jservices_user"),
			getEnv("DB_PASSWORD", "changeme"),
			getEnv("DB_HOST", "localhost"),
			getEnv("DB_PORT", "5432"),
			getEnv("DB_NAME", "jservices"),
		)
	}

	return &Config{
		Env:         getEnv("ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: dbURL,
		JWTSecret:   mustEnv("JWT_SECRET"),
		JWTExpiry:   getEnv("JWT_EXPIRY", "24h"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		WANumber:    getEnv("WHATSAPP_NUMBER", "22672157058"),

		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required env var %s is not set", key))
	}
	return v
}
