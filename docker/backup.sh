#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/openpos_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup..."
docker exec openpos-db pg_dump -U openpos -d openpos | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "openpos_*.sql.gz" -mtime +30 -delete
echo "Old backups cleaned up."
