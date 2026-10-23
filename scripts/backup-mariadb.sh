#!/bin/sh
set -eu
: "$MARIADB_DATABASE"
: "$MARIADB_USER"
: "$MARIADB_PASSWORD"
umask 077
mkdir -p /backups
export MYSQL_PWD="$MARIADB_PASSWORD"
while true; do
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output="/backups/modelvault-$stamp.sql"
  temp="$output.tmp"
  if mariadb-dump --host=database --user="$MARIADB_USER" --single-transaction --quick "$MARIADB_DATABASE" > "$temp"; then
    mv "$temp" "$output"
    chmod 600 "$output"
    echo "Backup completed: $stamp"
    find /backups -maxdepth 1 -type f -name 'modelvault-*.sql' -mtime +14 -delete
  else
    rm -f "$temp"
    echo "ERROR: MariaDB backup failed" >&2
  fi
  sleep 86400
done
