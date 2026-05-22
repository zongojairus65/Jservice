package services

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"jservices/pkg/database"
)

type Handler struct{ db *database.DB }

func NewHandler(db *database.DB) *Handler { return &Handler{db: db} }

func RegisterPublicRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/services")
	g.GET("", h.List)
	g.GET("/:slug", h.Get)
}

func RegisterAdminRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/services")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.PATCH("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

type Service struct {
	ID                 string  `json:"id"`
	Slug               string  `json:"slug"`
	NameFr             string  `json:"name_fr"`
	NameEn             string  `json:"name_en"`
	DescFr             string  `json:"desc_fr"`
	DescEn             string  `json:"desc_en"`
	Price              *int    `json:"price"`
	OnQuote            bool    `json:"on_quote"`
	Badge              *string `json:"badge"`
	Icon               string  `json:"icon"`
	WhatsAppTemplate   *string `json:"whatsapp_template"`
	IsActive           bool    `json:"is_active"`
}

func (h *Handler) List(c *gin.Context) {
	rows, err := h.db.Query(context.Background(),
		`SELECT id, slug, name_fr, name_en, desc_fr, desc_en,
		        price, on_quote, badge, icon, whatsapp_template, is_active
		 FROM services WHERE is_active=true ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	svcs := []Service{}
	for rows.Next() {
		var s Service
		rows.Scan(&s.ID, &s.Slug, &s.NameFr, &s.NameEn, &s.DescFr, &s.DescEn,
			&s.Price, &s.OnQuote, &s.Badge, &s.Icon, &s.WhatsAppTemplate, &s.IsActive)
		svcs = append(svcs, s)
	}
	c.JSON(http.StatusOK, gin.H{"services": svcs})
}

func (h *Handler) Get(c *gin.Context) {
	slug := c.Param("slug")
	var s Service
	err := h.db.QueryRow(context.Background(),
		`SELECT id, slug, name_fr, name_en, desc_fr, desc_en,
		        price, on_quote, badge, icon, whatsapp_template, is_active
		 FROM services WHERE slug=$1 AND is_active=true`, slug,
	).Scan(&s.ID, &s.Slug, &s.NameFr, &s.NameEn, &s.DescFr, &s.DescEn,
		&s.Price, &s.OnQuote, &s.Badge, &s.Icon, &s.WhatsAppTemplate, &s.IsActive)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"service": s})
}

type CreateServiceRequest struct {
	Slug             string  `json:"slug" binding:"required"`
	NameFr           string  `json:"name_fr" binding:"required"`
	NameEn           string  `json:"name_en" binding:"required"`
	DescFr           string  `json:"desc_fr"`
	DescEn           string  `json:"desc_en"`
	Price            *int    `json:"price"`
	OnQuote          bool    `json:"on_quote"`
	Badge            *string `json:"badge"`
	Icon             string  `json:"icon"`
	WhatsAppTemplate *string `json:"whatsapp_template"`
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := uuid.New().String()
	_, err := h.db.Exec(context.Background(),
		`INSERT INTO services (id, slug, name_fr, name_en, desc_fr, desc_en, price, on_quote, badge, icon, whatsapp_template)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		id, req.Slug, req.NameFr, req.NameEn, req.DescFr, req.DescEn,
		req.Price, req.OnQuote, req.Badge, req.Icon, req.WhatsAppTemplate,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create service"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Dynamic price update (key feature)
	price, hasPrice := req["price"]
	if hasPrice {
		h.db.Exec(context.Background(), "UPDATE services SET price=$1, updated_at=NOW() WHERE id=$2", price, id)
	}
	if name, ok := req["name_fr"].(string); ok {
		h.db.Exec(context.Background(), "UPDATE services SET name_fr=$1, updated_at=NOW() WHERE id=$2", name, id)
	}
	if active, ok := req["is_active"].(bool); ok {
		h.db.Exec(context.Background(), "UPDATE services SET is_active=$1, updated_at=NOW() WHERE id=$2", active, id)
	}
	c.JSON(http.StatusOK, gin.H{"message": "service updated"})
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec(context.Background(), "UPDATE services SET is_active=false WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "service deactivated"})
}
