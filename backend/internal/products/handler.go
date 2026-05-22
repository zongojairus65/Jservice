package products

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"jservices/pkg/database"
)

type Handler struct{ db *database.DB }

func NewHandler(db *database.DB) *Handler { return &Handler{db: db} }

func RegisterPublicRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/products")
	g.GET("", h.List)
	g.GET("/:slug", h.Get)
}

func RegisterAdminRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/products")
	g.GET("", h.AdminList)
	g.POST("", h.Create)
	g.PATCH("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

// ─── Models ───────────────────────────────────────────────────────────────────

type Product struct {
	ID       string  `json:"id"`
	Slug     string  `json:"slug"`
	NameFr   string  `json:"name_fr"`
	NameEn   string  `json:"name_en"`
	DescFr   string  `json:"desc_fr"`
	DescEn   string  `json:"desc_en"`
	Price    *int    `json:"price"` // nil = on quote
	Category string  `json:"category"`
	Badge    *string `json:"badge"`
	Icon     string  `json:"icon"`
	FileURL  *string `json:"file_url,omitempty"`
	IsActive bool    `json:"is_active"`
}

// ─── List (public) ────────────────────────────────────────────────────────────

func (h *Handler) List(c *gin.Context) {
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := `
		SELECT id, slug, name_fr, name_en, desc_fr, desc_en,
		       price, category, badge, icon, is_active
		FROM products
		WHERE is_active = true
	`
	args := []interface{}{}
	idx := 1

	if category != "" {
		query += " AND category = $" + strconv.Itoa(idx)
		args = append(args, category)
		idx++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(idx) + " OFFSET $" + strconv.Itoa(idx+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Slug, &p.NameFr, &p.NameEn, &p.DescFr, &p.DescEn,
			&p.Price, &p.Category, &p.Badge, &p.Icon, &p.IsActive); err != nil {
			continue
		}
		products = append(products, p)
	}

	c.JSON(http.StatusOK, gin.H{"products": products, "page": page, "limit": limit})
}

// ─── Get by slug ──────────────────────────────────────────────────────────────

func (h *Handler) Get(c *gin.Context) {
	slug := c.Param("slug")

	var p Product
	err := h.db.QueryRow(context.Background(),
		`SELECT id, slug, name_fr, name_en, desc_fr, desc_en,
		        price, category, badge, icon, is_active
		 FROM products WHERE slug=$1 AND is_active=true`, slug,
	).Scan(&p.ID, &p.Slug, &p.NameFr, &p.NameEn, &p.DescFr, &p.DescEn,
		&p.Price, &p.Category, &p.Badge, &p.Icon, &p.IsActive)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"product": p})
}

// ─── Admin List (includes inactive) ──────────────────────────────────────────

func (h *Handler) AdminList(c *gin.Context) {
	rows, err := h.db.Query(context.Background(),
		`SELECT id, slug, name_fr, name_en, desc_fr, desc_en,
		        price, category, badge, icon, is_active
		 FROM products ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var p Product
		rows.Scan(&p.ID, &p.Slug, &p.NameFr, &p.NameEn, &p.DescFr, &p.DescEn,
			&p.Price, &p.Category, &p.Badge, &p.Icon, &p.IsActive)
		products = append(products, p)
	}
	c.JSON(http.StatusOK, gin.H{"products": products})
}

// ─── Create ───────────────────────────────────────────────────────────────────

type CreateRequest struct {
	Slug     string  `json:"slug" binding:"required"`
	NameFr   string  `json:"name_fr" binding:"required"`
	NameEn   string  `json:"name_en" binding:"required"`
	DescFr   string  `json:"desc_fr"`
	DescEn   string  `json:"desc_en"`
	Price    *int    `json:"price"`
	Category string  `json:"category" binding:"required"`
	Badge    *string `json:"badge"`
	Icon     string  `json:"icon"`
	FileURL  *string `json:"file_url"`
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(context.Background(),
		`INSERT INTO products (id, slug, name_fr, name_en, desc_fr, desc_en, price, category, badge, icon, file_url)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		id, req.Slug, req.NameFr, req.NameEn, req.DescFr, req.DescEn,
		req.Price, req.Category, req.Badge, req.Icon, req.FileURL,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "product created"})
}

// ─── Update (prix dynamique admin) ───────────────────────────────────────────

type UpdateRequest struct {
	NameFr   *string `json:"name_fr"`
	NameEn   *string `json:"name_en"`
	DescFr   *string `json:"desc_fr"`
	DescEn   *string `json:"desc_en"`
	Price    *int    `json:"price"` // admin can set to nil (on quote)
	Badge    *string `json:"badge"`
	Icon     *string `json:"icon"`
	IsActive *bool   `json:"is_active"`
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Exec(context.Background(),
		`UPDATE products SET
			name_fr  = COALESCE($1, name_fr),
			name_en  = COALESCE($2, name_en),
			desc_fr  = COALESCE($3, desc_fr),
			desc_en  = COALESCE($4, desc_en),
			price    = $5,
			badge    = COALESCE($6, badge),
			icon     = COALESCE($7, icon),
			is_active= COALESCE($8, is_active),
			updated_at = NOW()
		 WHERE id=$9`,
		req.NameFr, req.NameEn, req.DescFr, req.DescEn,
		req.Price, req.Badge, req.Icon, req.IsActive, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product updated"})
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.db.Exec(context.Background(),
		"UPDATE products SET is_active=false, updated_at=NOW() WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product deactivated"})
}
