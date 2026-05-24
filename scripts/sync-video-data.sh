#!/bin/bash

# Script to sync video analysis data and generate business metrics
# Usage: ./scripts/sync-video-data.sh

BASE_URL=${NEXT_PUBLIC_APP_URL:-"http://localhost:3000"}

echo "🔄 Starting video data synchronization..."

# Step 1: Migrate video analysis data
echo "📹 Migrating video analysis data..."
MIGRATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/migrate-video-activities" \
  -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully"
  echo "$MIGRATE_RESPONSE" | grep -o '"migratedCount":[0-9]*' | cut -d':' -f2 | xargs echo "Videos migrated:"
else
  echo "❌ Migration failed"
  exit 1
fi

# Step 2: Calculate business metrics for regions
echo "📊 Calculating business metrics..."

REGIONS=("EAST" "WEST" "NORTH" "SOUTH" "CENTRAL")
METRICS_CREATED=0

for region in "${REGIONS[@]}"; do
  echo "📈 Processing region: $region"
  
  METRICS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/business-metrics" \
    -H "Content-Type: application/json" \
    -d "{\"region\":\"$region\",\"periodType\":\"all-time\"}")
  
  if echo "$METRICS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Business metrics created for $region"
    ((METRICS_CREATED++))
  else
    echo "⚠️  No data found for region $region"
  fi
done

echo ""
echo "🎉 Synchronization completed successfully!"
echo "📊 Business metrics created for $METRICS_CREATED regions"
echo ""
echo "💡 You can now use the Business Management tab to create business units"
echo "   with proper region-based dropdowns populated from your database."