package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type DB = pgxpool.Pool

func Connect(dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}

	cfg.MaxConns = 25
	cfg.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}

	return pool, nil
}

// Migrate runs all .sql files in the migrations directory in order.
func Migrate(db *pgxpool.Pool) error {
	// Ensure migrations table exists
	_, err := db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("create migrations table: %w", err)
	}

	// Read applied migrations
	rows, err := db.Query(context.Background(), "SELECT version FROM schema_migrations")
	if err != nil {
		return err
	}
	applied := map[string]bool{}
	for rows.Next() {
		var v string
		rows.Scan(&v)
		applied[v] = true
	}
	rows.Close()

	// Find migration files
	files, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(files)

	for _, f := range files {
		name := filepath.Base(f)
		if applied[name] {
			continue
		}

		content, err := os.ReadFile(f)
		if err != nil {
			return fmt.Errorf("read %s: %w", f, err)
		}

		// Execute the whole file in one call via the simple query protocol.
		// This correctly handles multi-statement files, including PL/pgSQL
		// function bodies wrapped in $$ ... $$ that contain their own semicolons
		// (naive splitting on ";" would break those apart).
		conn, err := db.Acquire(context.Background())
		if err != nil {
			return fmt.Errorf("acquire connection for %s: %w", name, err)
		}
		_, err = conn.Conn().PgConn().Exec(context.Background(), string(content)).ReadAll()
		conn.Release()
		if err != nil {
			return fmt.Errorf("execute %s: %w", name, err)
		}

		// Mark as applied
		db.Exec(context.Background(), "INSERT INTO schema_migrations(version) VALUES($1)", name)
		log.Info().Str("migration", name).Msg("✅ Migration applied")
	}

	return nil
}