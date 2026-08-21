/** Página de error 500 mínima, en español y con la estética del salón. */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>El salón está cerrado por un momento</title>
    <style>
      html,body{margin:0;height:100%}
      body{background:#050402;color:#ecebe6;display:grid;place-items:center;
        font-family:system-ui,sans-serif;text-align:center;padding:24px}
      h1{font-size:20px;letter-spacing:.18em;text-transform:uppercase;color:#dcb862;margin:0 0 12px}
      p{max-width:32ch;line-height:1.5;opacity:.85;margin:0 0 20px}
      a{display:inline-block;padding:12px 22px;border:1px solid rgba(220,184,98,.6);
        color:#dcb862;text-decoration:none;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
    </style>
  </head>
  <body>
    <main>
      <h1>El salón está cerrado</h1>
      <p>Algo se cortó del otro lado de la cortina. Volvé a intentar en un momento.</p>
      <a href="/">Reintentar</a>
    </main>
  </body>
</html>`;
}
