package orders

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
	g := rg.Group("/orders")
	g.POST("", h.Create)
	g.GET("", h.ListByUser)
	g.GET("/:id", h.GetByID)
}

// ─── Models ───────────────────────────────────────────────────────────────────

type OrderItem struct {
	ProductID  *string `json:"product_id"`
	ServiceID  *string `json:"service_id"`
	Quantity   int     `json:"quantity"`
	UnitPrice  *int    `json:"unit_price"`
}

type CreateOrderRequest struct {
	Items         []OrderItem `json:"items" binding:"required,min=1"`
	PaymentMethod string      `json:"payment_method" binding:"required"`
	GuestName     *string     `json:"guest_name"`
	GuestPhone    *string     `json:"guest_phone"`
	Notes         *string     `json:"notes"`
}

// ─── Create ───────────────────────────────────────────────────────────────────

func (h *Handler) Create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")
	orderID := uuid.New().String()

	// Calculate total from DB prices (never trust client-side prices)
	total := 0
	for _, item := range req.Items {
		if item.ProductID != nil {
			var price int
			err := h.db.QueryRow(context.Background(),
				"SELECT COALESCE(price, 0) FROM products WHERE id=$1 AND is_active=true",
				*item.ProductID,
			).Scan(&price)
			if err == nil {
				total += price * item.Quantity
			}
		}
		if item.ServiceID != nil {
			var price int
			err := h.db.QueryRow(context.Background(),
				"SELECT COALESCE(price, 0) FROM services WHERE id=$1 AND is_active=true",
				*item.ServiceID,
			).Scan(&price)
			if err == nil {
				total += price * item.Quantity
			}
		}
	}

	// Insert order
	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	}

	_, err := h.db.Exec(context.Background(),
		`INSERT INTO orders (id, user_id, guest_name, guest_phone, total, payment_method, notes, status)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,
		orderID, userIDPtr, req.GuestName, req.GuestPhone, total, req.PaymentMethod, req.Notes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	// Insert items
	for _, item := range req.Items {
		itemID := uuid.New().String()
		unitPrice := 0

		if item.ProductID != nil {
			h.db.QueryRow(context.Background(),
				"SELECT COALESCE(price,0) FROM products WHERE id=$1", *item.ProductID,
			).Scan(&unitPrice)
		}
		if item.ServiceID != nil {
			h.db.QueryRow(context.Background(),
				"SELECT COALESCE(price,0) FROM services WHERE id=$1", *item.ServiceID,
			).Scan(&unitPrice)
		}

		h.db.Exec(context.Background(),
			`INSERT INTO order_items (id, order_id, product_id, service_id, quantity, unit_price, total_price)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			itemID, orderID, item.ProductID, item.ServiceID,
			item.Quantity, unitPrice, unitPrice*item.Quantity,
		)
	}

	// Fetch created order with ref
	var orderRef string
	h.db.QueryRow(context.Background(),
		"SELECT order_ref FROM orders WHERE id=$1", orderID,
	).Scan(&orderRef)

	c.JSON(http.StatusCreated, gin.H{
		"order_id":  orderID,
		"order_ref": orderRef,
		"total":     total,
		"status":    "pending",
		"message":   "Order created. Please complete payment.",
	})
}

// ─── List by user ─────────────────────────────────────────────────────────────

func (h *Handler) ListByUser(c *gin.Context) {
	userID := c.GetString("userID")

	rows, err := h.db.Query(context.Background(),
		`SELECT id, order_ref, total, status, payment_method, created_at
		 FROM orders WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	type Order struct {
		ID            string `json:"id"`
		OrderRef      string `json:"order_ref"`
		Total         *int   `json:"total"`
		Status        string `json:"status"`
		PaymentMethod string `json:"payment_method"`
		CreatedAt     string `json:"created_at"`
	}

	orders := []Order{}
	for rows.Next() {
		var o Order
		rows.Scan(&o.ID, &o.OrderRef, &o.Total, &o.Status, &o.PaymentMethod, &o.CreatedAt)
		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userID")

	var order struct {
		ID            string `json:"id"`
		OrderRef      string `json:"order_ref"`
		Total         *int   `json:"total"`
		Status        string `json:"status"`
		PaymentMethod string `json:"payment_method"`
		Notes         *string `json:"notes"`
		CreatedAt     string `json:"created_at"`
	}

	err := h.db.QueryRow(context.Background(),
		`SELECT id, order_ref, total, status, payment_method, notes, created_at
		 FROM orders WHERE id=$1 AND user_id=$2`, id, userID,
	).Scan(&order.ID, &order.OrderRef, &order.Total, &order.Status,
		&order.PaymentMethod, &order.Notes, &order.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	// Get items
	rows, _ := h.db.Query(context.Background(),
		`SELECT oi.id, oi.quantity, oi.unit_price, oi.total_price,
		        p.name_fr, p.name_en, s.name_fr, s.name_en
		 FROM order_items oi
		 LEFT JOIN products p ON p.id = oi.product_id
		 LEFT JOIN services s ON s.id = oi.service_id
		 WHERE oi.order_id=$1`, id)
	defer rows.Close()

	type Item struct {
		ID         string  `json:"id"`
		Quantity   int     `json:"quantity"`
		UnitPrice  *int    `json:"unit_price"`
		TotalPrice *int    `json:"total_price"`
		NameFr     *string `json:"name_fr"`
		NameEn     *string `json:"name_en"`
	}

	items := []Item{}
	for rows.Next() {
		var item Item
		var pNameFr, pNameEn, sNameFr, sNameEn *string
		rows.Scan(&item.ID, &item.Quantity, &item.UnitPrice, &item.TotalPrice,
			&pNameFr, &pNameEn, &sNameFr, &sNameEn)
		if pNameFr != nil {
			item.NameFr = pNameFr
			item.NameEn = pNameEn
		} else {
			item.NameFr = sNameFr
			item.NameEn = sNameEn
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{"order": order, "items": items})
}
