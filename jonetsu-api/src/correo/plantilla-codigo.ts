import { MINUTOS_CODIGO_VERIFICACION } from '../common/reglas-negocio.js';

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Correo con el código para confirmar que el correo es de quien se registra
export function plantillaCodigo(nombre: string, codigo: string) {
  const asunto = `Tu código de verificación de Jonetsu: ${codigo}`;

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 8px;font-size:22px">¡Hola, ${escapar(nombre)}!</h1>
    <p style="margin:0 0 24px;color:#52525b">Escribe este código para terminar de crear tu cuenta.</p>
    <div style="text-align:center;background:#fafafa;border:2px dashed #d4d4d8;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;font-family:'Courier New',monospace">${codigo}</div>
      <div style="font-size:13px;color:#71717a;margin-top:8px">Vence en ${MINUTOS_CODIGO_VERIFICACION} minutos</div>
    </div>
    <p style="margin:0;font-size:12px;color:#a1a1aa">Si no fuiste tú, ignora este correo: nadie podrá usar tu correo sin este código.</p>
  </div>
</body>
</html>`;

  const texto = [
    `¡Hola, ${nombre}!`,
    'Escribe este código para terminar de crear tu cuenta en Jonetsu:',
    '',
    `    ${codigo}`,
    '',
    `Vence en ${MINUTOS_CODIGO_VERIFICACION} minutos.`,
    'Si no fuiste tú, ignora este correo.',
  ].join('\n');

  return { asunto, html, texto };
}
