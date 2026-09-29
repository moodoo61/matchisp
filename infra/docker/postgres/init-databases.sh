#!/bin/bash
set -euo pipefail

databases=(
  db_core
  db_network_pages
  db_live
  db_break
  db_comms
  db_magazine
  db_maintenance
  db_partners
  db_inventory
  db_orders
  db_support
  db_expenses
  db_platform
  db_service_monitor
  db_settings
  db_network
)

for db in "${databases[@]}"; do
  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done
