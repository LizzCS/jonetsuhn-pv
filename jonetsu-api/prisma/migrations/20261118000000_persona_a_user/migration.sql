-- Renombra persona -> user conservando los datos existentes

-- Enum
ALTER TYPE "rol_persona" RENAME TO "rol_user";

-- Tabla y columna primaria
ALTER TABLE "persona" RENAME TO "user";
ALTER TABLE "user" RENAME COLUMN "id_persona" TO "id_user";
ALTER TABLE "user" RENAME CONSTRAINT "persona_pkey" TO "user_pkey";
ALTER INDEX "persona_email_key" RENAME TO "user_email_key";

-- FK en ticket
ALTER TABLE "ticket" RENAME COLUMN "id_persona" TO "id_user";
ALTER TABLE "ticket" RENAME CONSTRAINT "ticket_id_persona_fkey" TO "ticket_id_user_fkey";
