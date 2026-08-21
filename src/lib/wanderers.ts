import borrachoUrl from "@/assets/wanderers/borracho.webp";
import cobradorUrl from "@/assets/wanderers/cobrador.webp";
import mensajeraUrl from "@/assets/wanderers/mensajera.webp";
import piboUrl from "@/assets/wanderers/pibo.webp";
import pitonisaUrl from "@/assets/wanderers/pitonisa.webp";
import carniceroUrl from "@/assets/wanderers/carnicero.webp";
import sepultureroUrl from "@/assets/wanderers/sepulturero.webp";
import marineraUrl from "@/assets/wanderers/marinera.webp";
import curaUrl from "@/assets/wanderers/cura.webp";
import viudaUrl from "@/assets/wanderers/viuda.webp";
import boxeadorUrl from "@/assets/wanderers/boxeador.webp";
import tahurUrl from "@/assets/wanderers/tahur.webp";
import barbudaUrl from "@/assets/wanderers/barbuda.webp";
import prestamistaUrl from "@/assets/wanderers/prestamista.webp";
import contorsionistaUrl from "@/assets/wanderers/contorsionista.webp";
import inspectorUrl from "@/assets/wanderers/inspector.webp";
import periodistaUrl from "@/assets/wanderers/periodista.webp";
import aprendizUrl from "@/assets/wanderers/aprendiz.webp";

export interface WanderingNPC {
  id: string;
  name: string;
  whisper: string;
  route: string[];
  glyph: string;
  portrait: string;
  alias: string;
  skill: number;
  activeHours?: [number, number][];
  preferredRooms?: string[];
}

export const WANDERERS: WanderingNPC[] = [
  {
    id: "borracho",
    name: "Tulio «Ranas» Bevilacqua",
    alias: "Ranas",
    whisper: "«…y entonces le dije al capitán… ¿dónde estaba yo?»",
    route: ["/bar", "/salon", "/callejon", "/pasadizo", "/exterior"],
    glyph: "🍾",
    portrait: borrachoUrl,
    skill: 0.55,
    activeHours: [
      [18, 24],
      [0, 3],
    ],
    preferredRooms: ["/bar", "/salon", "/callejon"],
  },
  {
    id: "cobrador",
    name: "Silvano «El Libro» Marchetti",
    alias: "El Libro",
    whisper: "«Vengo por lo del martes. Corvina sabe.»",
    route: ["/despacho/antesala", "/despacho", "/salon", "/tables", "/tables"],
    glyph: "📜",
    portrait: cobradorUrl,
    skill: 1.15,
    activeHours: [[10, 18]],
    preferredRooms: ["/despacho", "/despacho/antesala", "/tables"],
  },
  {
    id: "mensajera",
    name: "Nonna Cirila del Correo",
    alias: "Nonna Cirila",
    whisper: "«Carta urgente. Segundo piso. No preguntes de quién.»",
    route: ["/despacho", "/despacho", "/exterior", "/terraza", "/salon"],
    glyph: "🕊",
    portrait: mensajeraUrl,
    skill: 0.9,
    activeHours: [[6, 14]],
    preferredRooms: ["/despacho", "/terraza", "/despacho"],
  },
  {
    id: "pibe",
    name: "Pichi el de los Recados",
    alias: "Pichi",
    whisper: "«Diez centavos por llevarle esto a la señora Perla.»",
    route: ["/bar", "/camerinos", "/salon"],
    glyph: "🎩",
    portrait: piboUrl,
    skill: 0.65,
    activeHours: [[8, 20]],
    preferredRooms: ["/bar"],
  },
  {
    id: "pitonisa",
    name: "Madama Fenicia Draghi",
    alias: "Draghi",
    whisper: "«La bola dice que hoy no sos vos, querido.»",
    route: ["/salon", "/despacho/lounge", "/terraza", "/camerinos", "/despacho"],
    glyph: "🎩",
    portrait: pitonisaUrl,
    skill: 1.25,
    activeHours: [[16, 23]],
    preferredRooms: ["/salon", "/despacho/lounge", "/terraza"],
  },
  {
    id: "carnicero",
    name: "Beppe «Cuchilla» Farro",
    alias: "Beppe",
    whisper: "«Corvina paga en carne. Yo cobro en fichas.»",
    route: ["/callejon", "/bar"],
    glyph: "🔪",
    portrait: carniceroUrl,
    skill: 0.8,
    activeHours: [[5, 13]],
    preferredRooms: ["/bar"],
  },
  {
    id: "sepulturero",
    name: "Ezequiel «Lirio» Vanhorn",
    alias: "Lirio",
    whisper: "«Reservé mesa. No para jugar. Para esperar.»",
    route: ["/exterior", "/pasadizo", "/despacho/archivo", "/terraza"],
    glyph: "🎩",
    portrait: sepultureroUrl,
    skill: 1.05,
    activeHours: [
      [20, 24],
      [0, 5],
    ],
    preferredRooms: ["/exterior", "/pasadizo", "/despacho/archivo"],
  },
  {
    id: "marinera",
    name: "Capitana Ondina «Muñón» Sárközy",
    alias: "Muñón",
    whisper: "«Al que me gana le firmo el brazo. Con la izquierda.»",
    route: ["/exterior", "/callejon", "/bar", "/salon", "/pasadizo"],
    glyph: "⚓",
    portrait: marineraUrl,
    skill: 1.0,
    activeHours: [[14, 23]],
    preferredRooms: ["/exterior", "/bar", "/callejon"],
  },
  {
    id: "cura",
    name: "Padre Anselmo «Frasco» Larraín",
    alias: "Frasco",
    whisper: "«El Señor perdona. La Corvina, no tanto.»",
    route: ["/bar", "/salon", "/callejon", "/retrete", "/exterior"],
    glyph: "✝",
    portrait: curaUrl,
    skill: 0.7,
    activeHours: [[11, 19]],
    preferredRooms: ["/bar", "/salon", "/retrete"],
  },
  {
    id: "viuda",
    name: "Doña Ilaria «La Enlutada» Vespucci",
    alias: "La Enlutada",
    whisper: "«Vengo a rezar. Y a mirar. Sobre todo a mirar.»",
    route: ["/despacho/lounge", "/salon", "/despacho", "/terraza", "/pasadizo"],
    glyph: "🕯",
    portrait: viudaUrl,
    skill: 1.2,
    activeHours: [[15, 22]],
    preferredRooms: ["/despacho/lounge", "/salon", "/despacho"],
  },
  {
    id: "boxeador",
    name: "Nikos «Mandíbula» Zafiropoulos",
    alias: "Mandíbula",
    whisper: "«Antes cobraba por trompada. Ahora por silencio.»",
    route: ["/callejon", "/exterior", "/bar", "/pasadizo"],
    glyph: "🥊",
    portrait: boxeadorUrl,
    skill: 0.85,
    activeHours: [[17, 24]],
    preferredRooms: ["/callejon", "/exterior"],
  },
  {
    id: "tahur",
    name: "Baldomero «Cinco Ases» Krupnik",
    alias: "Cinco Ases",
    whisper: "«Yo no hago trampa. Yo corrijo la suerte.»",
    route: ["/tables", "/tables", "/salon", "/despacho/lounge", "/bar"],
    glyph: "🂡",
    portrait: tahurUrl,
    skill: 1.35,
    activeHours: [
      [19, 24],
      [0, 4],
    ],
    preferredRooms: ["/tables", "/tables", "/despacho/lounge"],
  },
  {
    id: "barbuda",
    name: "Madama Yerma «La Barbuda» Kalfayan",
    alias: "La Barbuda",
    whisper: "«Las cartas dicen que tenés dos caras. Yo tengo tres.»",
    route: ["/despacho", "/salon", "/terraza", "/camerinos", "/despacho/archivo"],
    glyph: "🃏",
    portrait: barbudaUrl,
    skill: 1.1,
    activeHours: [[13, 21]],
    preferredRooms: ["/despacho", "/salon", "/camerinos"],
  },
  {
    id: "prestamista",
    name: "Yehuda «El Monóculo» Krajnc",
    alias: "El Monóculo",
    whisper: "«Todo se empeña. Hasta el alma. Sobre todo el alma.»",
    route: ["/despacho/antesala", "/despacho/archivo", "/trastienda", "/pasadizo"],
    glyph: "🪙",
    portrait: prestamistaUrl,
    skill: 1.3,
    activeHours: [[9, 17]],
    preferredRooms: ["/despacho/antesala", "/despacho/archivo", "/trastienda"],
  },
  {
    id: "contorsionista",
    name: "Fedra «Espinazo» Zaharescu",
    alias: "Espinazo",
    whisper: "«Doy la vuelta como quieras. El corazón, no.»",
    route: ["/camerinos", "/musica", "/salon", "/terraza", "/despacho/lounge"],
    glyph: "🎭",
    portrait: contorsionistaUrl,
    skill: 0.95,
    activeHours: [
      [21, 24],
      [0, 3],
    ],
    preferredRooms: ["/camerinos", "/musica", "/salon"],
  },
  {
    id: "inspector",
    name: "Comisario Tarquinio «Sudor» Baglietto",
    alias: "Sudor",
    whisper: "«Vine por un trago. Nada más. Por hoy.»",
    route: ["/exterior", "/bar", "/salon", "/despacho/antesala", "/callejon"],
    glyph: "🎖",
    portrait: inspectorUrl,
    skill: 1.15,
    activeHours: [
      [22, 24],
      [0, 4],
    ],
    preferredRooms: ["/exterior", "/bar", "/callejon"],
  },
  {
    id: "periodista",
    name: "Aliocha «Tinta» Vranković",
    alias: "Tinta",
    whisper: "«Todo esto sale mañana. O nunca. Depende de la Corvina.»",
    route: ["/salon", "/musica", "/despacho", "/exterior", "/despacho/lounge"],
    glyph: "📰",
    portrait: periodistaUrl,
    skill: 1.05,
    activeHours: [[18, 24]],
    preferredRooms: ["/salon", "/musica", "/despacho/lounge"],
  },
  {
    id: "aprendiz",
    name: "Fermín «Frasquito» Ozieblo",
    alias: "Frasquito",
    whisper: "«Mi tío dice que la señora Ethel todavía escucha.»",
    route: ["/pasadizo", "/trastienda", "/despacho/archivo", "/exterior"],
    glyph: "⚱",
    portrait: aprendizUrl,
    skill: 0.5,
    activeHours: [[6, 12]],
    preferredRooms: ["/pasadizo", "/trastienda"],
  },
];

const ROTATION_MS = 2 * 60 * 60 * 1000;

export function getWanderersAt(route: string, now: Date = new Date()): WanderingNPC[] {
  const tick = Math.floor(now.getTime() / ROTATION_MS);
  const hour = now.getHours();
  const out: WanderingNPC[] = [];
  for (const w of WANDERERS) {
    if (w.route.length === 0) continue;
    if (w.activeHours && !w.activeHours.some(([from, to]) => hour >= from && hour < to)) continue;
    const idx = (tick + hashId(w.id)) % w.route.length;
    const currentRoute = w.route[idx];
    if (currentRoute !== route) continue;
    if (w.preferredRooms && !w.preferredRooms.includes(route) && route !== w.route[0]) continue;
    out.push(w);
  }
  return out.slice(0, 1);
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
