-- Remove duplicate receipt categories, keeping only the first one
WITH duplicates AS (
  SELECT id, name, 
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as rn
  FROM "ReceiptCategory"
)
DELETE FROM "ReceiptCategory" 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);