-- Add audit actions for removing/updating a saved payment method.
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_METHOD_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_METHOD_UPDATED';
