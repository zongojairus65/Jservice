package payments

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"jservices/pkg/database"
)

type Handler struct{ db *database.DB }

func NewHandler(db *database.DB) *Handler { return &Handler{db: db} }

func RegisterRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/payments")
	g.POST("/:order_id/confirm", h.Confirm)
	g.GET("/:order_id", h.GetByOrder)
}

// ─── Confirm payment (user submits proof) ────────────────────────────────────

type ConfirmRequest struct {
	Method      string `json:"method" binding:"required"` // mobilemoney | manual
	Provider    string `json:"provider"`                  // orange_money | moov | wave
	ProviderRef string `json:"provider_ref"`              // transaction ID
}

func (h *Handler) Confirm(c *gin.Context) {
	orderID := c.Param("order_id")
	userID := c.GetString("userID")

	var req ConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify order belongs to user
	var total int
	err := h.db.QueryRow(context.Background(),
		"SELECT COALESCE(total, 0) FROM orders WHERE id=$1 AND user_id=$2",
		orderID, userID,
	).Scan(&total)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	paymentID := uuid.New().String()
	_, err = h.db.Exec(context.Background(),
		`INSERT INTO payments (id, order_id, amount, method, provider, provider_ref, status)
		 VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
		paymentID, orderID, total, req.Method, req.Provider, req.ProviderRef,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record payment"})
		return
	}

	// Update order status to 'payment_submitted'
	h.db.Exec(context.Background(),
		"UPDATE orders SET status='payment_submitted', updated_at=NOW() WHERE id=$1", orderID)

	c.JSON(http.StatusCreated, gin.H{
		"payment_id": paymentID,
		"status":     "pending",
		"message":    "Payment submitted. Admin will validate shortly.",
	})
}

// ─── Get payment for order ────────────────────────────────────────────────────

func (h *Handler) GetByOrder(c *gin.Context) {
	orderID := c.Param("order_id")

	var payment struct {
		ID          string  `json:"id"`
		Amount      int     `json:"amount"`
		Method      string  `json:"method"`
		Provider    *string `json:"provider"`
		ProviderRef *string `json:"provider_ref"`
		Status      string  `json:"status"`
		CreatedAt   string  `json:"created_at"`
	}

	err := h.db.QueryRow(context.Background(),
		`SELECT id, amount, method, provider, provider_ref, status, created_at
		 FROM payments WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, orderID,
	).Scan(&payment.ID, &payment.Amount, &payment.Method, &payment.Provider,
		&payment.ProviderRef, &payment.Status, &payment.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"payment": payment})
}
