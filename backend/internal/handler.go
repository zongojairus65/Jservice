package admin

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"jservices/pkg/database"
)

type Handler struct{ db *database.DB }

func NewHandler(db *database.DB) *Handler { return &Handler{db: db} }

func RegisterRoutes(rg *gin.RouterGroup, h *Handler) {
	rg.GET("/stats", h.Stats)

	// Orders
	rg.GET("/orders", h.ListOrders)
	rg.PATCH("/orders/:id/status", h.UpdateOrderStatus)

	// Payments
	rg.GET("/payments", h.ListPayments)
	rg.PATCH("/payments/:id/validate", h.ValidatePayment)

	// Users
	rg.GET("/users", h.ListUsers)
	rg.PATCH("/users/:id/role", h.UpdateUserRole)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

func (h *Handler) Stats(c *gin.Context) {
	ctx := context.Background()

	var totalRevenue, monthRevenue int
	h.db.QueryRow(ctx, "SELECT COALESCE(SUM(total),0) FROM orders WHERE status IN ('paid','delivered')").Scan(&totalRevenue)
	h.db.QueryRow(ctx,
		"SELECT COALESCE(SUM(total),0) FROM orders WHERE status IN ('paid','delivered') AND created_at >= date_trunc('month', NOW())",
	).Scan(&monthRevenue)

	var totalOrders, pendingOrders, paidOrders, deliveredOrders int
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM orders").Scan(&totalOrders)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM orders WHERE status='pending' OR status='payment_submitted'").Scan(&pendingOrders)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM orders WHERE status='paid'").Scan(&paidOrders)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM orders WHERE status='delivered'").Scan(&deliveredOrders)

	var totalUsers, newUsers int
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE role='user'").Scan(&totalUsers)
	h.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'",
	).Scan(&newUsers)

	var totalProducts, totalServices int
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM products WHERE is_active=true").Scan(&totalProducts)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM services WHERE is_active=true").Scan(&totalServices)

	c.JSON(http.StatusOK, gin.H{
		"revenue": gin.H{
			"total": totalRevenue,
			"month": monthRevenue,
		},
		"orders": gin.H{
			"total":     totalOrders,
			"pending":   pendingOrders,
			"paid":      paidOrders,
			"delivered": deliveredOrders,
		},
		"users": gin.H{
			"total":         totalUsers,
			"new_this_month": newUsers,
		},
		"catalog": gin.H{
			"products": totalProducts,
			"services": totalServices,
		},
		"generated_at": time.Now().UTC(),
	})
}

// ─── Orders ───────────────────────────────────────────────────────────────────

func (h *Handler) ListOrders(c *gin.Context) {
	status := c.Query("status")
	ctx := context.Background()

	query := `
		SELECT o.id, o.order_ref, o.total, o.status, o.payment_method,
		       o.created_at, o.guest_name, o.guest_phone,
		       u.name, u.email, u.phone
		FROM orders o
		LEFT JOIN users u ON u.id = o.user_id
	`
	args := []interface{}{}
	if status != "" {
		query += " WHERE o.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY o.created_at DESC LIMIT 100"

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	type OrderRow struct {
		ID            string  `json:"id"`
		OrderRef      string  `json:"order_ref"`
		Total         *int    `json:"total"`
		Status        string  `json:"status"`
		PaymentMethod string  `json:"payment_method"`
		CreatedAt     string  `json:"created_at"`
		GuestName     *string `json:"guest_name"`
		GuestPhone    *string `json:"guest_phone"`
		UserName      *string `json:"user_name"`
		UserEmail     *string `json:"user_email"`
		UserPhone     *string `json:"user_phone"`
	}

	orders := []OrderRow{}
	for rows.Next() {
		var o OrderRow
		rows.Scan(&o.ID, &o.OrderRef, &o.Total, &o.Status, &o.PaymentMethod,
			&o.CreatedAt, &o.GuestName, &o.GuestPhone,
			&o.UserName, &o.UserEmail, &o.UserPhone)
		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders, "total": len(orders)})
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *Handler) UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"pending": true, "payment_submitted": true,
		"paid": true, "processing": true,
		"delivered": true, "cancelled": true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	_, err := h.db.Exec(context.Background(),
		"UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2", req.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "order status updated", "status": req.Status})
}

// ─── Payments ─────────────────────────────────────────────────────────────────

func (h *Handler) ListPayments(c *gin.Context) {
	rows, err := h.db.Query(context.Background(),
		`SELECT p.id, p.order_id, p.amount, p.method, p.provider,
		        p.provider_ref, p.status, p.created_at, o.order_ref
		 FROM payments p
		 JOIN orders o ON o.id = p.order_id
		 ORDER BY p.created_at DESC LIMIT 100`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	type PaymentRow struct {
		ID          string  `json:"id"`
		OrderID     string  `json:"order_id"`
		OrderRef    string  `json:"order_ref"`
		Amount      int     `json:"amount"`
		Method      string  `json:"method"`
		Provider    *string `json:"provider"`
		ProviderRef *string `json:"provider_ref"`
		Status      string  `json:"status"`
		CreatedAt   string  `json:"created_at"`
	}

	payments := []PaymentRow{}
	for rows.Next() {
		var p PaymentRow
		rows.Scan(&p.ID, &p.OrderID, &p.Amount, &p.Method, &p.Provider,
			&p.ProviderRef, &p.Status, &p.CreatedAt, &p.OrderRef)
		payments = append(payments, p)
	}

	c.JSON(http.StatusOK, gin.H{"payments": payments})
}

func (h *Handler) ValidatePayment(c *gin.Context) {
	id := c.Param("id")
	adminID := c.GetString("userID")

	// Get payment order_id
	var orderID string
	err := h.db.QueryRow(context.Background(),
		"SELECT order_id FROM payments WHERE id=$1", id).Scan(&orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Validate payment
	h.db.Exec(context.Background(),
		`UPDATE payments SET status='validated', validated_by=$1, validated_at=NOW()
		 WHERE id=$2`, adminID, id)

	// Update order to paid
	h.db.Exec(context.Background(),
		"UPDATE orders SET status='paid', updated_at=NOW() WHERE id=$1", orderID)

	c.JSON(http.StatusOK, gin.H{"message": "payment validated, order marked as paid"})
}

// ─── Users ────────────────────────────────────────────────────────────────────

func (h *Handler) ListUsers(c *gin.Context) {
	rows, err := h.db.Query(context.Background(),
		`SELECT id, name, email, phone, role, is_active, created_at
		 FROM users ORDER BY created_at DESC LIMIT 200`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	type UserRow struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
		IsActive  bool   `json:"is_active"`
		CreatedAt string `json:"created_at"`
	}

	users := []UserRow{}
	for rows.Next() {
		var u UserRow
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.IsActive, &u.CreatedAt)
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "total": len(users)})
}

func (h *Handler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Role != "user" && req.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be user or admin"})
		return
	}
	h.db.Exec(context.Background(),
		"UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2", req.Role, id)
	c.JSON(http.StatusOK, gin.H{"message": "role updated"})
}
