import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import reglasHero from "@/assets/reglas-hero.webp";
import { IconChinche } from "@/components/casino/DecoIcons";

export const Route = createFileRoute("/reglas")({
  head: () => ({
    meta: [
      { title: "Reglas — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Reglas de todos los juegos del salón: truco, chinchón, escoba, blackjack, ruleta, dados, mahjong, solitario, póker y bagatelle.",
      },
      { property: "og:title", content: "Reglas — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Aprendé las reglas de cada mesa del salón.",
      },
    ],
  }),
  component: ReglasPage,
});

type GameGuide = {
  id: string;
  title: string;
  hostess: string;
  summary: string;
  sections: { title: string; body: string[] }[];
};

const GUIDES: GameGuide[] = [
  {
    id: "truco",
    title: "Mentira Criolla (Truco)",
    hostess: "Eulalia",
    summary:
      "Duelo mano a mano con mazo español. Envido, truco y flor: ganás sabiendo mentir y leer al rival.",
    sections: [
      {
        title: "Objetivo y mazo",
        body: [
          "Mazo español de 40 cartas (1-7, 10, 11, 12 × oros, copas, espadas, bastos).",
          "Se juega uno contra uno. Gana quien llega primero a 15 o 30 puntos.",
          "En cada mano se reparten 3 cartas. El «mano» juega primero y gana los empates de envido.",
        ],
      },
      {
        title: "Jerarquía de cartas",
        body: [
          "1º As de espadas (macho) · 2º As de bastos (hembra) · 3º 7 de espadas · 4º 7 de oros.",
          "Después: los treses, doses, ases falsos (oros y copas), reyes, caballos, sotas.",
          "Al final: 7 falsos (copas y bastos), seis, cinco, cuatro. Cartas iguales empardan.",
        ],
      },
      {
        title: "Cómo se gana la mano",
        body: [
          "Se juegan hasta 3 bazas; gana quien gane 2.",
          "Si se emparda la 1ª, decide la 2ª. Si se emparda la 2ª o la 3ª, pesa la 1ª ganada.",
          "Si empardan las tres, gana el mano.",
        ],
      },
      {
        title: "Envido (sólo en la 1ª baza)",
        body: [
          "Se cuenta con dos cartas del mismo palo: 20 + los dos números más altos. Figuras (10, 11, 12) valen 0.",
          "Envido = 2 · Real envido = +3 · Falta envido = lo que le falta al que va ganando.",
          "«No quiero» paga el nivel anterior (mínimo 1). En empate de tantos, gana el mano.",
        ],
      },
      {
        title: "Truco y flor",
        body: [
          "Truco = 2 · Retruco = 3 · Vale 4. Sólo lo sube quien aceptó el canto anterior.",
          "Flor = 3 puntos (3 cartas del mismo palo). Contraflor = 6 · Contraflor al resto = 9.",
          "«El envido está primero»: si te cantan truco en la 1ª baza podés cortar con envido.",
        ],
      },
    ],
  },
  {
    id: "chinchon",
    title: "El Corte Sucio (Chinchón)",
    hostess: "Luisa",
    summary:
      "Armá escaleras del mismo palo o tríos iguales. Cortá con pocos puntos sueltos o cerrá con el chinchón.",
    sections: [
      {
        title: "Objetivo",
        body: [
          "Bajar tu puntaje bajando combinaciones. Perdés cuando pasás los 100 puntos.",
          "En cada ronda se reparten 7 cartas. Robás una y descartás una.",
        ],
      },
      {
        title: "Combinaciones válidas",
        body: [
          "Escaleras de 3 o más cartas del mismo palo (A-2-3, 5-6-7-8…).",
          "Tríos o cuartas del mismo número (tres o cuatro reyes, por ejemplo).",
        ],
      },
      {
        title: "Cortar",
        body: [
          "Podés cortar cuando la suma de tus cartas sueltas es ≤ 3.",
          "Si cortás en cero, te descontás 10 puntos.",
          "Chinchón = 7 cartas en escalera del mismo palo. Victoria automática.",
        ],
      },
      {
        title: "La Carta Sucia",
        body: [
          "Una vez por partida podés marcar una carta de tu mano con la uña: pasa a funcionar como comodín para armar cualquier juego.",
          "El precio: si queda suelta suma 25, y si cerrás con ella en la mano pagás 5 puntos de soborno al croupier.",
          "La rival tiene la suya y la usa cuando está contra las cuerdas. Fijate en la marca roja bajo la carta.",
        ],
      },
    ],
  },
  {
    id: "escoba",
    title: "Barrido de Quince (Escoba)",
    hostess: "Shauna",
    summary: "Levantá cartas de la mesa combinándolas para sumar exactamente 15.",
    sections: [
      {
        title: "Reglas",
        body: [
          "Mazo español. Se reparten 3 cartas por jugador y 4 boca arriba en la mesa.",
          "En tu turno, tirás una carta. Si con cartas de la mesa suma 15, las levantás.",
          "Si no, la carta queda en la mesa.",
        ],
      },
      {
        title: "Escoba",
        body: [
          "Si te llevás TODAS las cartas de la mesa en una jugada = escoba (1 punto extra).",
          "Al final se cuentan: más cartas, más oros, siete de oros, más sietes.",
        ],
      },
    ],
  },
  {
    id: "blackjack",
    title: "Filo de Veintiuno (Blackjack)",
    hostess: "Vita",
    summary: "Llegá lo más cerca posible a 21 sin pasarte. Vencé la mano del croupier.",
    sections: [
      {
        title: "Valor de las cartas",
        body: [
          "Figuras (J, Q, K) valen 10. Ases valen 1 u 11 según convenga.",
          "El resto vale su número.",
        ],
      },
      {
        title: "Turno",
        body: [
          "Pedís (hit) o te plantás (stand). Si pasás 21, te pasás y perdés.",
          "Podés doblar la apuesta con las dos primeras cartas (double).",
          "Si te dan un par, podés dividir en dos manos (split).",
        ],
      },
      {
        title: "Blackjack natural",
        body: [
          "As + 10/figura de mano = blackjack. Paga 3:2 salvo empate con el dealer.",
          "El dealer se planta en 17 duro. Sigue pidiendo con menos.",
        ],
      },
    ],
  },
  {
    id: "ruleta",
    title: "La Rueda del Cuervo (Ruleta)",
    hostess: "Clara",
    summary: "Apostá números, colores, docenas o filas y girá la rueda.",
    sections: [
      {
        title: "Tipos de apuesta",
        body: [
          "Pleno (un número): paga 35 a 1.",
          "Rojo/Negro, Par/Impar, Alta/Baja: pagan 1 a 1.",
          "Docena o columna: paga 2 a 1. Línea de 6: paga 5 a 1.",
        ],
      },
      {
        title: "Flujo",
        body: [
          "Colocá fichas en el tapete. Cerrá apuestas y girá.",
          "El cero es del banco: no paga rojo/negro ni par/impar.",
          "Podés retirarte cuando quieras; las ganancias se acreditan solas.",
        ],
      },
    ],
  },
  {
    id: "dados",
    title: "Cinco Huesos (Dados y Cartas)",
    hostess: "Zelda",
    summary: "Tres tiros por turno para cerrar contratos antes que la anfitriona.",
    sections: [
      {
        title: "Turno",
        body: [
          "Tirás los 5 dados. Guardás los que querés y volvés a tirar. Máximo 3 tiros.",
          "Al cerrar el turno elegís un contrato de la mesa que cumplan tus dados: te lo llevás y sale de juego.",
          "Si ningún contrato cierra, se quema el más barato y perdés el turno.",
        ],
      },
      {
        title: "Contratos",
        body: [
          "Cada noche se reparten 6 contratos boca arriba: menores, mayores y una leyenda.",
          "Cerrarlo en el primer tiro (servida) paga más.",
          "Ejemplos: Trío del Sótano, Escalera del Fondo, Full de Corvina, Póker de Huesos, Los Cinco Huesos.",
        ],
      },
      {
        title: "Cartas de favor",
        body: [
          "Empezás con tres favores, uno solo por carta: tiro extra, girar un dado, cambiar un contrato de la mesa, doblar el próximo cobro o robarle el último contrato a la anfitriona.",
          "La noche termina cuando no queda ningún contrato libre; gana quien sumó más.",
        ],
      },
    ],
  },
  {
    id: "mahjong",
    title: "Marfil Paciente (Mahjong)",
    hostess: "Jade",
    summary: "Emparejá fichas libres hasta vaciar el tablero.",
    sections: [
      {
        title: "Reglas básicas",
        body: [
          "Sólo podés seleccionar fichas «libres»: sin ficha encima y con al menos un lado (izq. o der.) despejado.",
          "Dos fichas idénticas se eliminan del tablero.",
          "Flores y estaciones combinan entre sí aunque no sean idénticas.",
        ],
      },
      {
        title: "Consejos",
        body: [
          "Priorizá abrir la base del tablero antes de resolver pares fáciles arriba.",
          "Usá el deshacer (FAB) si te trabás. La pausa guarda la partida.",
        ],
      },
    ],
  },
  {
    id: "solitario",
    title: "La Mano Muerta (Solitario)",
    hostess: "Jade",
    summary: "Ordená las 4 pilas por palo, del As al Rey.",
    sections: [
      {
        title: "Tablero",
        body: [
          "7 columnas: la primera con 1 carta, la última con 7. Sólo la de arriba está boca arriba.",
          "4 fundaciones vacías arriba a la derecha. El mazo se queda a la izquierda.",
        ],
      },
      {
        title: "Movimientos",
        body: [
          "Alterná colores rojos y negros en las columnas, en orden descendente.",
          "En las fundaciones subís por palo, del As al Rey.",
          "Sólo un Rey (o secuencia empezando en Rey) puede ocupar columna vacía.",
        ],
      },
    ],
  },
  {
    id: "bagatelle",
    title: "Clavo y Suerte (Bagatelle)",
    hostess: "Lola",
    summary: "Lanzá la bola con fuerza calibrada y buscá agujeros altos.",
    sections: [
      {
        title: "Reglas",
        body: [
          "Ajustás la fuerza y soltás la bola.",
          "Los agujeros centrales pagan más. Si cae al fondo, no suma.",
          "Tenés un número fijo de bolas por partida.",
        ],
      },
    ],
  },
  {
    id: "poker",
    title: "Cara de Piedra (Póker)",
    hostess: "Lola",
    summary:
      "Texas Hold'em de límite fijo a tres manos: vos, Lola y Bruno. Ganá el pozo con la mejor jugada de cinco cartas.",
    sections: [
      {
        title: "Objetivo y ronda",
        body: [
          "Entrás con 300 fichas de la casa. Recibís 2 cartas tapadas y se reparten 5 comunitarias.",
          "Se apuesta en cuatro etapas: preflop, flop (3 cartas), turn (1) y river (1).",
          "Armás la mejor jugada de 5 cartas combinando tus 2 con las comunitarias.",
        ],
      },
      {
        title: "Apuestas de límite fijo",
        body: [
          "Ciega chica y ciega grande rotan cada mano.",
          "Subidas de tamaño fijo: una ciega grande en preflop y flop, el doble en turn y river.",
          "Podés pasar, igualar, subir o retirarte. Retirarse pierde lo apostado, no el resto.",
        ],
      },
      {
        title: "Jerarquía de jugadas",
        body: [
          "Escalera color · Póker · Full · Color · Escalera · Trío · Doble par · Par · Carta alta.",
          "El As sirve alto o bajo: A-2-3-4-5 es escalera válida (la rueda).",
          "Si empatan las jugadas, el pozo se divide.",
        ],
      },
      {
        title: "Cara de piedra",
        body: [
          "Cuando un rival mueve, a veces se le escapa un gesto: la pista arriesga farol o firme.",
          "La lectura puede mentir. Al descubrirse las cartas, el legajo anota si acertaste.",
          "Cuanto más estudiado tenés a un rival, más seguido lo leés y menos te engaña.",
          "Ojo con tu propia cara: si tardás demasiado en decidir, la mesa aprieta y farolea más.",
        ],
      },
      {
        title: "Los rivales",
        body: [
          "Lola juega cerrada: entra con poco pero castiga cuando sube.",
          "Bruno juega suelto y agresivo: farolea seguido, pero se le nota el apuro.",
          "Al salir de la mesa tus fichas vuelven a tu caja.",
        ],
      },
    ],
  },
  {
    id: "sindicato",
    title: "El Sindicato (conquista)",
    hostess: "Eulalia",
    summary:
      "Conquista roguelike por barrios del puerto: cada noche son cinco oleadas con mapa nuevo, cartas tácticas y talismanes.",
    sections: [
      {
        title: "Turno a turno",
        body: [
          "Desplegás tropas en tus territorios, atacás zonas limítrofes y finalizás el turno.",
          "El ataque se resuelve por dados: más tropas, más chances, nunca certeza.",
          "Conquistar un territorio te obliga a mover al menos una tropa a la zona tomada.",
        ],
      },
      {
        title: "Refuerzos y control",
        body: [
          "Cada turno recibís refuerzos según territorios controlados y zonas completas.",
          "Controlar una zona entera suma un bono fijo de tropas.",
          "La barra superior muestre el control de cada facción sobre el mapa.",
        ],
      },
      {
        title: "Cartas tácticas y facciones",
        body: [
          "Soborno, Informante y Golpe Sorpresa alteran la partida por una sola vez.",
          "Cada facción tiene un efecto propio: presión, información o velocidad.",
          "Las cartas se juegan antes de atacar y se descartan al usarse.",
        ],
      },
      {
        title: "La noche roguelike",
        body: [
          "Toda partida es una corrida: cinco oleadas con mapa nuevo y dificultad creciente.",
          "Al superar una oleada elegís un talismán o un naipe que te acompaña el resto de la noche.",
          "Si te eliminan, la noche termina, pero conservás los Favores del Cuervo ganados.",
        ],
      },
    ],
  },
];

function ReglasPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-[var(--cd-noir-1)] text-[var(--marfil)]">
      <div
        className="mx-auto max-w-3xl px-4 sm:px-6"
        style={{
          paddingTop: "calc(var(--sa-top) + 16px)",
          paddingBottom: "calc(var(--sa-bottom) + 140px)",
        }}
      >
        {/* Barra superior con retorno */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="paria-eyebrow">El Cuervo Dorado</p>
        </div>

        {/* Cartel pintado sobre foto pegada al muro */}
        <div className="paria-photo relative mb-6 overflow-hidden">
          <span aria-hidden className="cinta -left-5 top-3 -rotate-[9deg] z-10" />
          <span aria-hidden className="cinta -right-5 top-3 rotate-[9deg] z-10" />
          <img
            src={reglasHero}
            alt=""
            width={1536}
            height={640}
            className="h-40 w-full object-cover sm:h-52"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--cd-noir-1)] via-[var(--cd-noir-1)]/55 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 text-center">
            <p className="paria-eyebrow">— Manual clandestino —</p>
            <h1 className="paria-sign text-4xl sm:text-5xl">REGLAS</h1>
            <span aria-hidden className="paria-rule mt-2 w-32" />
          </div>
        </div>

        <p
          className="mb-8 px-1 text-center text-[13px] leading-relaxed text-[var(--marfil)]/80"
          style={{ fontFamily: "'Special Elite', monospace" }}
        >
          Reglas rápidas de cada mesa. Tocá una carta para desplegar sus secciones.
        </p>

        <ul className="space-y-4">
          {GUIDES.map((g) => {
            const open = openId === g.id;
            return (
              <li
                key={g.id}
                className={`paria-paper paria-grime overflow-hidden rounded-[3px] transition-colors ${
                  open ? "border-[var(--oro)]/60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : g.id)}
                  aria-expanded={open}
                  aria-controls={`tuto-${g.id}`}
                  className="relative flex w-full items-start justify-between gap-4 px-5 py-5 text-left min-h-[72px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="paria-sign text-2xl">{g.title}</h2>
                      <span className="paria-eyebrow">· {g.hostess}</span>
                    </div>
                    <p
                      className="mt-2 text-[13px] leading-relaxed text-[var(--marfil)]/80"
                      style={{ fontFamily: "'Special Elite', monospace" }}
                    >
                      {g.summary}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-2 shrink-0 text-lg text-[var(--oro)] transition-transform"
                    style={{ transform: open ? "rotate(90deg)" : "none" }}
                  >
                    ▸
                  </span>
                </button>

                {open ? (
                  <div
                    id={`tuto-${g.id}`}
                    className="relative border-t border-[var(--oro)]/25 bg-black/35 px-5 py-6"
                  >
                    <ol className="space-y-6">
                      {g.sections.map((s, i) => (
                        <li key={i}>
                          <div className="mb-3 flex items-center gap-2">
                            <IconChinche size={13} className="shrink-0 text-[var(--oro)]/80" />
                            <h3 className="paria-eyebrow">{s.title}</h3>
                            <span aria-hidden className="paria-rule flex-1" />
                          </div>
                          <ul className="space-y-2.5">
                            {s.body.map((line, j) => (
                              <li
                                key={j}
                                className="pl-4 text-[13px] leading-relaxed text-[var(--marfil)]/80 border-l-2 border-[var(--oro)]/25"
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
