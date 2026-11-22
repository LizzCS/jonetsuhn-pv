-- CreateTable
CREATE TABLE "verificacion_correo" (
    "email" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificacion_correo_pkey" PRIMARY KEY ("email")
);
