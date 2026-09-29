#!/usr/bin/env bash
# Local helper when Docker is unavailable: create isp role + section databases.
set -euo pipefail

USER_NAME="${POSTGRES_USER:-isp}"
PASSWORD="${POSTGRES_PASSWORD:-isp_secret}"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${USER_NAME}') THEN
    CREATE ROLE ${USER_NAME} LOGIN PASSWORD '${PASSWORD}';
  END IF;
END
\$\$;
SQL

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
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
SELECT 'CREATE DATABASE ${db} OWNER ${USER_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${db} TO ${USER_NAME};
SQL
  sudo -u postgres psql -d "$db" -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO ${USER_NAME}; ALTER SCHEMA public OWNER TO ${USER_NAME};"
done

echo "Databases ready for user ${USER_NAME}"
