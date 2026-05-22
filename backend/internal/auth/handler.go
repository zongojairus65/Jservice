package auth

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"jservices/internal/config"
	"jservices/pkg/database"
	jwtpkg "jservices/pkg/jwt"
)

type Handler struct {
	db  *database.DB
	cfg *config.Config
}

func NewHandler(db *database.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, cfg: cfg}
}

func RegisterRoutes(rg *gin.RouterGroup, h *Handler) {
	auth := rg.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.GET("/me", JWTMiddleware(h.cfg.JWTSecret), h.Me)
		auth.POST("/refresh", h.Refresh)
	}
}

// ─── Register ─────────────────────────────────────────────────────────────────

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Phone    string `json:"phone"`
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check existing
	var exists bool
	err := h.db.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", req.Email,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password hash error"})
		return
	}

	// Insert user
	userID := uuid.New().String()
	_, err = h.db.Exec(context.Background(),
		`INSERT INTO users (id, name, email, password, phone, role, provider)
		 VALUES ($1, $2, $3, $4, $5, 'user', 'email')`,
		userID, req.Name, req.Email, string(hash), req.Phone,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	token, err := jwtpkg.Generate(userID, req.Email, "user", h.cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":    userID,
			"name":  req.Name,
			"email": req.Email,
			"role":  "user",
		},
	})
}

// ─── Login ────────────────────────────────────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user struct {
		ID       string
		Name     string
		Email    string
		Password string
		Role     string
	}

	err := h.db.QueryRow(context.Background(),
		"SELECT id, name, email, password, role FROM users WHERE email=$1 AND is_active=true",
		req.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := jwtpkg.Generate(user.ID, user.Email, user.Role, h.cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// ─── Me ───────────────────────────────────────────────────────────────────────

func (h *Handler) Me(c *gin.Context) {
	userID := c.GetString("userID")

	var user struct {
		ID        string
		Name      string
		Email     string
		Phone     string
		WhatsApp  string
		AvatarURL *string
		Role      string
		CreatedAt time.Time
	}

	err := h.db.QueryRow(context.Background(),
		"SELECT id, name, email, phone, whatsapp, avatar_url, role, created_at FROM users WHERE id=$1",
		userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.WhatsApp, &user.AvatarURL, &user.Role, &user.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

func (h *Handler) Refresh(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	claims, err := jwtpkg.Validate(tokenStr, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	newToken, err := jwtpkg.Generate(claims.UserID, claims.Email, claims.Role, h.cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": newToken})
}
