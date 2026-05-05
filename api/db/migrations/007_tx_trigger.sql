-- +goose Up

-- +goose StatementBegin
CREATE TRIGGER delete_transaction_if_no_entries
AFTER DELETE ON entries
FOR EACH ROW
BEGIN
  DELETE FROM transactions
  WHERE id = OLD.transaction_id
  AND NOT EXISTS (
    SELECT 1 FROM entries
    WHERE transaction_id = OLD.transaction_id
  );
END;
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER delete_transaction_if_no_entries;
