/**
 * server/db.js — PostgreSQL connection pool singleton
 * ────────────────────────────────────────────────────────────
 * Required .env variables:
 *   PGUSER     — postgres username
 *   PGPASSWORD — postgres password
 *   PGHOST     — host (usually localhost)
 *   PGPORT     — port (usually 5432)
 *   PGDATABASE — database name
 *
 * Usage: import pool from './db.js', then pool.query(sql, params)
 */
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export default pool
