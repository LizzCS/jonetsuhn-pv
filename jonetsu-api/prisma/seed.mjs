// Datos de prueba: usuarios, categorías, productos y servicios (eventos
// con horarios y cupos), como si un admin los hubiera agregado.
// Se puede correr varias veces: no duplica nada.
//
// Uso (desde jonetsu-api):  pnpm build  &&  node prisma/seed.mjs
// Contraseña de todos los usuarios de prueba: Prueba123!
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD = 'Prueba123!';

const usuarios = [
  { nombre: 'Admin', apellido: 'Prueba', telefono: '+50499990000', email: 'admin@prueba.com', rol: 'admin' },
  { nombre: 'Carlos', apellido: 'Mejía', telefono: '+50499990001', email: 'carlos@prueba.com', rol: 'cliente' },
  { nombre: 'María', apellido: 'López', telefono: '+50499990002', email: 'maria@prueba.com', rol: 'cliente' },
  { nombre: 'José', apellido: 'Hernández', telefono: '+50499990003', email: 'jose@prueba.com', rol: 'cliente' },
  { nombre: 'Ana', apellido: 'Martínez', telefono: '+50499990004', email: 'ana@prueba.com', rol: 'cliente' },
];

const categorias = ['Ramen', 'Entradas', 'Bebidas', 'Postres'];

const productos = [
  { categoria: 'Ramen', nombre: 'Ramen Tonkotsu', descripcion: 'Caldo de cerdo, chashu, huevo marinado y cebollín', precio: 320 },
  { categoria: 'Ramen', nombre: 'Ramen Shoyu', descripcion: 'Caldo de pollo con salsa de soya, menma y nori', precio: 290 },
  { categoria: 'Ramen', nombre: 'Ramen Miso Vegetariano', descripcion: 'Caldo de miso con tofu, maíz y vegetales', precio: 270 },
  { categoria: 'Entradas', nombre: 'Gyozas (6 u.)', descripcion: 'Empanaditas de cerdo a la plancha', precio: 150 },
  { categoria: 'Entradas', nombre: 'Edamame', descripcion: 'Con sal de mar', precio: 90 },
  { categoria: 'Bebidas', nombre: 'Té verde frío', descripcion: null, precio: 60 },
  { categoria: 'Bebidas', nombre: 'Ramune', descripcion: 'Soda japonesa', precio: 80 },
  { categoria: 'Postres', nombre: 'Mochi de matcha (2 u.)', descripcion: null, precio: 110 },
];

// Servicios (eventos) en fechas futuras, con sus horarios
function enDias(dias) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

const eventos = [
  { nombre: 'Noche de Ramen', descripcion: 'Servicio en el local de Col. Palmira', fecha: enDias(7), horas: ['18:00', '19:30', '21:00'] },
  { nombre: 'Ramen al Mediodía', descripcion: 'Almuerzo en Plaza Miraflores', fecha: enDias(14), horas: ['11:30', '13:00'] },
  { nombre: 'Festival Japonés', descripcion: 'Stand en el festival cultural', fecha: enDias(21), horas: ['10:00', '14:00', '17:00'] },
];

const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

async function main() {
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  for (const u of usuarios) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password_hash },
    });
  }

  const idCategoria = {};
  for (const nombre of categorias) {
    const c = await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre } });
    idCategoria[nombre] = c.id_categoria;
  }

  const idsProductos = [];
  for (const p of productos) {
    let prod = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    prod ??= await prisma.producto.create({
      data: {
        id_categoria: idCategoria[p.categoria],
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
      },
    });
    idsProductos.push(prod.id_producto);
  }

  for (const e of eventos) {
    let ev = await prisma.evento.findFirst({ where: { nombre: e.nombre } });
    ev ??= await prisma.evento.create({
      data: { nombre: e.nombre, descripcion: e.descripcion, fecha: e.fecha },
    });

    for (const h of e.horas) {
      const hor = await prisma.horario.upsert({
        where: { id_evento_hora: { id_evento: ev.id_evento, hora: hora(h) } },
        update: {},
        create: { id_evento: ev.id_evento, hora: hora(h) },
      });

      for (const id_producto of idsProductos) {
        await prisma.horario_producto.upsert({
          where: { id_horario_id_producto: { id_horario: hor.id_horario, id_producto } },
          update: {},
          create: { id_horario: hor.id_horario, id_producto, cupo_total: 20 },
        });
      }
    }
  }

  console.log('Seed listo:');
  console.log(`  usuarios:   ${await prisma.user.count()}`);
  console.log(`  categorias: ${await prisma.categoria.count()}`);
  console.log(`  productos:  ${await prisma.producto.count()}`);
  console.log(`  eventos:    ${await prisma.evento.count()}`);
  console.log(`  horarios:   ${await prisma.horario.count()}`);
  console.log(`  cupos:      ${await prisma.horario_producto.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
