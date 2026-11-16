-- AlterTable
ALTER TABLE "pago" ADD COLUMN     "motivo_rechazo" TEXT,
ADD COLUMN     "verificado_en" TIMESTAMP(3);

-- Reglas que Prisma no expresa en el schema: se agregan a mano.
-- Si alguna falla, hay filas de prueba con valores inválidos: bórralas o corrígelas antes.
ALTER TABLE "ticket_item" ADD CONSTRAINT "ticket_item_cantidad_positiva" CHECK ("cantidad" > 0);
ALTER TABLE "pago" ADD CONSTRAINT "pago_monto_positivo" CHECK ("monto" > 0);
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_total_no_negativo" CHECK ("total" >= 0);
ALTER TABLE "horario_producto" ADD CONSTRAINT "horario_producto_cupo_no_negativo" CHECK ("cupo_total" >= 0);
