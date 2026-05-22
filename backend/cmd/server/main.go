package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"jservices/internal/admin"
	"jservices/internal/auth"
	"jservices/internal/chat"
	"jservices/internal/config"
	"jservices/internal/orders"
	"jservices/internal/payments"
	"jservices/internal/products"
	"jservices/internal/services"
	"jservices/pkg/database"
)

func main() {
	// Load .env (dev only)
	_ = godotenv.Load()

	// Logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if os.Getenv("ENV") == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	}

	// Config
	cfg := config.Load()

	// Database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer db.Close()
	log.Info().Msg("✅ Database connected")

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}

	// Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(requestLogger())

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "jservices-api",
			"version": "1.0.0",
		})
	})

	// API v1
	v1 := r.Group("/api/v1")

	// Public routes
	authHandler := auth.NewHandler(db, cfg)
	auth.RegisterRoutes(v1, authHandler)

	productHandler := products.NewHandler(db)
	products.RegisterPublicRoutes(v1, productHandler)

	serviceHandler := services.NewHandler(db)
	services.RegisterPublicRoutes(v1, serviceHandler)

	// Protected routes (JWT required)
	protected := v1.Group("")
	protected.Use(auth.JWTMiddleware(cfg.JWTSecret))
	{
		orders.RegisterRoutes(protected, orders.NewHandler(db))
		payments.RegisterRoutes(protected, payments.NewHandler(db))
	}

	// Admin routes
	adminGroup := v1.Group("/admin")
	adminGroup.Use(auth.JWTMiddleware(cfg.JWTSecret))
	adminGroup.Use(auth.AdminMiddleware())
	{
		admin.RegisterRoutes(adminGroup, admin.NewHandler(db))
		products.RegisterAdminRoutes(adminGroup, productHandler)
		services.RegisterAdminRoutes(adminGroup, serviceHandler)
	}

	// WebSocket chat
	chatHub := chat.NewHub()
	go chatHub.Run()
	r.GET("/ws/chat", func(c *gin.Context) {
		chat.ServeWS(chatHub, c.Writer, c.Request)
	})

	// HTTP Server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Info().Msgf("🚀 Server running on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}
	log.Info().Msg("Server exited")
}

func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Dur("latency", time.Since(start)).
			Str("ip", c.ClientIP()).
			Msg("request")
	}
}
