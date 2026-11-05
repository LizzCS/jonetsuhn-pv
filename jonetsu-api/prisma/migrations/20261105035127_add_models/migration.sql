/*
  Warnings:

  - You are about to drop the `test` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "estado_ticket" AS ENUM ('reservado', 'pago_en_revision', 'confirmado', 'entregado', 'cancelado');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('pendiente', 'verificado', 'rechazado', 'reembolsado');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('transferencia', 'efectivo', 'tarjeta');

-- CreateEnum
CREATE TYPE "rol_persona" AS ENUM ('cliente', 'admin');

-- DropTable
DROP TABLE "test";

-- CreateTable
CREATE TABLE "persona" (
    "id_persona" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "rol_persona" NOT NULL DEFAULT 'cliente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id_persona")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id_categoria" UUID NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "producto" (
    "id_producto" UUID NOT NULL,
    "id_categoria" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "horario" (
    "id_horario" UUID NOT NULL,
    "id_evento" UUID NOT NULL,
    "hora" TIME(6) NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horario_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "horario_producto" (
    "id_horario" UUID NOT NULL,
    "id_producto" UUID NOT NULL,
    "cupo_total" INTEGER NOT NULL,

    CONSTRAINT "horario_producto_pkey" PRIMARY KEY ("id_horario","id_producto")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id_ticket" UUID NOT NULL,
    "id_persona" UUID NOT NULL,
    "id_horario" UUID NOT NULL,
    "codigo_acceso" TEXT NOT NULL,
    "estado" "estado_ticket" NOT NULL DEFAULT 'reservado',
    "expira_en" TIMESTAMP(3) NOT NULL,
    "asistio" BOOLEAN,
    "notas" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id_ticket")
);

-- CreateTable
CREATE TABLE "ticket_item" (
    "id_item" UUID NOT NULL,
    "id_ticket" UUID NOT NULL,
    "id_producto" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ticket_item_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "pago" (
    "id_pago" UUID NOT NULL,
    "id_ticket" UUID NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodo" "metodo_pago" NOT NULL,
    "comprobante_url" TEXT,
    "estado" "estado_pago" NOT NULL DEFAULT 'pendiente',
    "verificado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateIndex
CREATE UNIQUE INDEX "persona_email_key" ON "persona"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "horario_id_evento_hora_key" ON "horario"("id_evento", "hora");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_codigo_acceso_key" ON "ticket"("codigo_acceso");

-- CreateIndex
CREATE INDEX "ticket_id_horario_estado_idx" ON "ticket"("id_horario", "estado");

-- CreateIndex
CREATE INDEX "ticket_expira_en_idx" ON "ticket"("expira_en");

-- CreateIndex
CREATE INDEX "ticket_item_id_ticket_idx" ON "ticket_item"("id_ticket");

-- CreateIndex
CREATE INDEX "ticket_item_id_producto_id_ticket_idx" ON "ticket_item"("id_producto", "id_ticket");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario" ADD CONSTRAINT "horario_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_producto" ADD CONSTRAINT "horario_producto_id_horario_fkey" FOREIGN KEY ("id_horario") REFERENCES "horario"("id_horario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_producto" ADD CONSTRAINT "horario_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_horario_fkey" FOREIGN KEY ("id_horario") REFERENCES "horario"("id_horario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_item" ADD CONSTRAINT "ticket_item_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket"("id_ticket") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_item" ADD CONSTRAINT "ticket_item_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket"("id_ticket") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_verificado_por_fkey" FOREIGN KEY ("verificado_por") REFERENCES "persona"("id_persona") ON DELETE SET NULL ON UPDATE CASCADE;
