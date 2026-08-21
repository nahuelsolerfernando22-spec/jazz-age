export type GiftSlot = "accessory" | "adornment" | "gesture" | "outfit";

export interface HostessGift {
  id: string;
  npcId: string;
  name: string;
  description: string;
  flavor: string;
  slot: GiftSlot;
  priceCoins: number;
  affinityBonus?: number;
  portraitVariant?: string;
  portraitVariants?: string[];
}

export const HOSTESS_GIFTS: HostessGift[] = [
  {
    id: "vita-cuchillo-hueso",
    npcId: "vita",
    name: "Cuchillo de Mango de Hueso",
    description: "Corto, curvo. Se guarda en la liga.",
    flavor: "«Un juguete útil. Me gusta que pienses en lo práctico.»",
    slot: "accessory",
    priceCoins: 2000,
    affinityBonus: 100,
    portraitVariant: "vita-gift-cuchillo-hueso",
  },
  {
    id: "vita-panuelo-rojo",
    npcId: "vita",
    name: "Pañuelo Rojo del Puerto",
    description: "Nudo de marinera, cuello. Marca de banda.",
    flavor: "«Rojo. Perfecto para no notar la sangre.»",
    slot: "adornment",
    priceCoins: 1200,
    affinityBonus: 55,
    portraitVariant: "vita-gift-panuelo-rojo",
  },
  {
    id: "vita-cinturon-navajas",
    npcId: "vita",
    name: "Cinturón de Navajas",
    description: "Cuero negro con seis fundas. Sonríe cuando lo abrocha.",
    flavor: "«Ahora sí puedo saludar como corresponde.»",
    slot: "adornment",
    priceCoins: 3400,
    affinityBonus: 190,
    portraitVariant: "vita-gift-cinturon-navajas",
  },

  {
    id: "opal-anteojos-oro",
    npcId: "opal",
    name: "Anteojos de Marco Dorado",
    description: "Redondos, dorados. Perfectos para leer libros trucados.",
    flavor: "«Marco dorado, cuentas más claras. Buena inversión.»",
    slot: "accessory",
    priceCoins: 1300,
    affinityBonus: 60,
  },
  {
    id: "opal-pluma-jade",
    npcId: "opal",
    name: "Pluma Fuente de Jade",
    description: "Cuerpo de jade verde, plumín de oro.",
    flavor: "«Escribe fino. Como los números que me gustan.»",
    slot: "accessory",
    priceCoins: 2200,
    affinityBonus: 110,
  },
  {
    id: "opal-blusa-seda",
    npcId: "opal",
    name: "Blusa de Seda Marfil",
    description: "Cuello alto, botones de nácar. Muy suya.",
    flavor: "«Ordenada por dentro y por fuera. Gracias.»",
    slot: "adornment",
    priceCoins: 1800,
    affinityBonus: 85,
  },

  {
    id: "zelda-turbante-oro",
    npcId: "zelda",
    name: "Turbante de Seda Oro",
    description: "Con broche de ojo de tigre.",
    flavor: "«Ah… ya lo había visto. En un sueño.»",
    slot: "adornment",
    priceCoins: 2000,
    affinityBonus: 100,
  },
  {
    id: "zelda-cartas-tarot",
    npcId: "zelda",
    name: "Baraja de Tarot Marsellés",
    description: "Cartas envejecidas, bordes dorados.",
    flavor: "«El Loco. Otra vez vos. Qué original.»",
    slot: "accessory",
    priceCoins: 1500,
    affinityBonus: 75,
  },
  {
    id: "zelda-bola-cristal",
    npcId: "zelda",
    name: "Bola de Cristal Ahumado",
    description: "Sobre trípode de bronce.",
    flavor: "«Veo… fichas. Muchas. Todas mías.»",
    slot: "adornment",
    priceCoins: 3200,
    affinityBonus: 180,
  },

  {
    id: "lola-brazalete-serpiente",
    npcId: "lola",
    name: "Brazalete Serpiente",
    description: "Oro y ónix. Le enrosca el brazo.",
    flavor: "«Canon, encanto — ahora sí soy yo.»",
    slot: "adornment",
    priceCoins: 2400,
    affinityBonus: 130,
  },
  {
    id: "lola-vestido-fleco",
    npcId: "lola",
    name: "Fleco Dorado Extra",
    description: "Un fleco extra para el vestido burdeos.",
    flavor: "«Más fleco, más suerte. Regla de la casa.»",
    slot: "adornment",
    priceCoins: 1700,
    affinityBonus: 80,
  },
  {
    id: "lola-pulsera-moneda",
    npcId: "lola",
    name: "Pulsera de Monedas",
    description: "Tres monedas antiguas colgando.",
    flavor: "«Que tintineen, así saben que gano.»",
    slot: "accessory",
    priceCoins: 1200,
    affinityBonus: 60,
  },

  {
    id: "jade-pin-dragon",
    npcId: "jade",
    name: "Broche Dragón de Jade",
    description: "Jade auténtico sobre plata ennegrecida.",
    flavor: "«Un dragón. Va a cuidar mis fichas por vos.»",
    slot: "adornment",
    priceCoins: 2800,
    affinityBonus: 145,
  },
  {
    id: "jade-abanico-seda",
    npcId: "jade",
    name: "Abanico de Seda Bordado",
    description: "Bordado con grullas, varillas de sándalo.",
    flavor: "«Un abanico. Sabés que la paciencia se abanica.»",
    slot: "accessory",
    priceCoins: 1900,
    affinityBonus: 95,
  },
  {
    id: "jade-pendientes-jade",
    npcId: "jade",
    name: "Pendientes de Jade Imperial",
    description: "Verde imperial, engarce en oro.",
    flavor: "«Imperial. Tenés más plata que gusto — pero acertaste.»",
    slot: "accessory",
    priceCoins: 3200,
    affinityBonus: 170,
  },

  {
    id: "bettie-anillo-calavera",
    npcId: "bettie",
    name: "Anillo de Calavera de Plata",
    description: "Pesado, ojos de rubí.",
    flavor: "«Calavera. Me estás leyendo bien.»",
    slot: "accessory",
    priceCoins: 2100,
    affinityBonus: 110,
  },
  {
    id: "bettie-corset-cuero",
    npcId: "bettie",
    name: "Corsé de Cuero Negro",
    description: "Con hebillas de latón lateral.",
    flavor: "«Cuero. Sabés lo que hacés — o eso parece.»",
    slot: "adornment",
    priceCoins: 2800,
    affinityBonus: 150,
  },
  {
    id: "bettie-pluma-negra",
    npcId: "bettie",
    name: "Pluma Negra en el Pelo",
    description: "Pluma de cuervo pulida.",
    flavor: "«Pluma de cuervo. Cursi. Igual me la pongo.»",
    slot: "adornment",
    priceCoins: 1300,
    affinityBonus: 65,
  },

  {
    id: "eulalia-mate-plata",
    npcId: "eulalia",
    name: "Mate de Plata Labrada",
    description: "Con bombilla de pico de loro.",
    flavor: "«Mate de plata — ahora sí somos amigos.»",
    slot: "accessory",
    priceCoins: 1800,
    affinityBonus: 90,
  },
  {
    id: "eulalia-daga-guardapunas",
    npcId: "eulalia",
    name: "Daga Guardapuñas",
    description: "Corta, empuñadura de asta.",
    flavor: "«Filo criollo. Se ve que no venís de visita.»",
    slot: "accessory",
    priceCoins: 2400,
    affinityBonus: 125,
  },
  {
    id: "eulalia-poncho-vicuna",
    npcId: "eulalia",
    name: "Poncho de Vicuña",
    description: "Marrón, franja negra.",
    flavor: "«Poncho fino. En el sótano se agradece.»",
    slot: "adornment",
    priceCoins: 2600,
    affinityBonus: 140,
  },
  {
    id: "eulalia-vestido-negro",
    npcId: "eulalia",
    name: "Vestido Negro Corto",
    description: "Satén negro, tirantes finos, fleco de abalorios en el ruedo. Le cambia el porte.",
    flavor: "«Corto y negro. Vas a perder mirándome, no jugando.»",
    slot: "adornment",
    priceCoins: 3200,
    affinityBonus: 180,
    portraitVariant: "eulalia-gift-vestido-negro",
  },

  {
    id: "clara-lapiz-nacar",
    npcId: "clara",
    name: "Lápiz de Apuestas de Nácar",
    description: "Con capuchón de plata.",
    flavor: "«Nácar. Marca fino, como debe ser.»",
    slot: "accessory",
    priceCoins: 1400,
    affinityBonus: 70,
  },
  {
    id: "clara-guantes-marfil",
    npcId: "clara",
    name: "Guantes de Cabritilla Marfil",
    description: "Hasta el codo, tres botones.",
    flavor: "«Marfil. Bien parisino de tu parte.»",
    slot: "adornment",
    priceCoins: 2100,
    affinityBonus: 110,
  },
  {
    id: "clara-medallon-17",
    npcId: "clara",
    name: "Medallón con el Número 17",
    description: "Su número. Oro pulido.",
    flavor: "«El 17. Cómo sabías, mon cher.»",
    slot: "adornment",
    priceCoins: 2600,
    affinityBonus: 140,
  },

  {
    id: "lin-pincel-caligrafia",
    npcId: "lin",
    name: "Pincel de Caligrafía",
    description: "Mango de bambú, pelo de marta.",
    flavor: "«Pincel fino. Voy a escribirte una cuenta bonita.»",
    slot: "accessory",
    priceCoins: 1400,
    affinityBonus: 70,
  },
  {
    id: "lin-peineta-jade",
    npcId: "lin",
    name: "Peineta de Jade Claro",
    description: "Grabada con bambúes.",
    flavor: "«Jade claro. Elegante, casi peligroso.»",
    slot: "adornment",
    priceCoins: 2300,
    affinityBonus: 120,
  },
  {
    id: "lin-abanico-tinta",
    npcId: "lin",
    name: "Abanico Pintado a Tinta",
    description: "Grullas negras sobre papel de arroz.",
    flavor: "«Tinta y arroz. Sabés respetarme.»",
    slot: "accessory",
    priceCoins: 1900,
    affinityBonus: 95,
  },

  {
    id: "salome-castanuelas",
    npcId: "salome",
    name: "Castañuelas de Palo Santo",
    description: "Talladas, cinta roja.",
    flavor: "«Castañuelas. Ahora sí bailo mientras te desplumo.»",
    slot: "accessory",
    priceCoins: 1300,
    affinityBonus: 65,
  },
  {
    id: "salome-mantilla-negra",
    npcId: "salome",
    name: "Mantilla Negra Bordada",
    description: "Encaje andaluz sobre peineta.",
    flavor: "«Mantilla. Muy Semana Santa — me gusta.»",
    slot: "adornment",
    priceCoins: 2000,
    affinityBonus: 100,
  },
  {
    id: "salome-anillo-toro",
    npcId: "salome",
    name: "Anillo con Cabeza de Toro",
    description: "Plata ennegrecida, ojos de rubí.",
    flavor: "«Toro de rubí. Alguien anda con hambre.»",
    slot: "accessory",
    priceCoins: 2400,
    affinityBonus: 125,
  },

  {
    id: "shauna-esmalte-rojo",
    npcId: "shauna",
    name: "Esmalte Rojo Sangre",
    description: "Frasco cuadrado, cristal grueso.",
    flavor: "«Uñas rojas para siempre. Buen chico.»",
    slot: "accessory",
    priceCoins: 900,
    affinityBonus: 45,
  },
  {
    id: "shauna-medias-costura",
    npcId: "shauna",
    name: "Medias de Costura Trasera",
    description: "Seda negra, línea perfecta.",
    flavor: "«Costura trasera. Fijate qué recta la llevo.»",
    slot: "adornment",
    priceCoins: 1600,
    affinityBonus: 80,
  },
  {
    id: "shauna-pitillera-laca",
    npcId: "shauna",
    name: "Pitillera de Laca Roja",
    description: "Larga, con anillo dorado.",
    flavor: "«Roja como todo lo mío. Bienvenido.»",
    slot: "accessory",
    priceCoins: 2100,
    affinityBonus: 110,
  },

  {
    id: "luisa-icono-plata",
    npcId: "luisa",
    name: "Ícono de Plata Ortodoxo",
    description: "Pequeño, para el cuello.",
    flavor: "«Ícono ruso. Vas entendiendo de dónde vengo.»",
    slot: "accessory",
    priceCoins: 2000,
    affinityBonus: 100,
  },
  {
    id: "luisa-cuello-piel",
    npcId: "luisa",
    name: "Cuello de Piel de Zorro",
    description: "Blanco invierno, sobre el hombro.",
    flavor: "«Zorro blanco. Como yo — muerdo primero.»",
    slot: "adornment",
    priceCoins: 2800,
    affinityBonus: 150,
  },
  {
    id: "luisa-cubilete-cuero",
    npcId: "luisa",
    name: "Cubilete de Cuero Ruso",
    description: "Cuero repujado, forro rojo.",
    flavor: "«Cubilete ruso. Ya somos dos para mentir.»",
    slot: "accessory",
    priceCoins: 1700,
    affinityBonus: 85,
  },

  {
    id: "vita-vestido-marinera",
    npcId: "vita",
    name: "Vestido Marinera Corto",
    description: "Rayas blancas y azul marino, cuello marinero. Práctico y filoso.",
    flavor: "«Rayas de puerto. Ahora sí parezco de la banda.»",
    slot: "outfit",
    priceCoins: 2800,
    affinityBonus: 140,
    portraitVariant: "vita-gift-vestido-marinera",
  },

  {
    id: "opal-vestido-cuadros",
    npcId: "opal",
    name: "Vestido de Cuadros Negros",
    description: "Estampa de cuadrícula fina en blanco y negro. Cuello alto, cinturón fino.",
    flavor: "«Cuadrícula. Sabés hablarme en mi idioma.»",
    slot: "outfit",
    priceCoins: 2600,
    affinityBonus: 130,
  },

  {
    id: "zelda-vestido-oraculo",
    npcId: "zelda",
    name: "Vestido Oráculo Azul",
    description:
      "Túnica larga azul medianoche de terciopelo con símbolos zodiacales bordados en plata. Fajín granate.",
    flavor: "«Ya lo había soñado — pero gracias por regalarlo igual.»",
    slot: "outfit",
    priceCoins: 4400,
    affinityBonus: 220,
    portraitVariant: "zelda-vestido-oraculo",
  },

  {
    id: "lola-vestido-fleco-rojo",
    npcId: "lola",
    name: "Vestido Flecos Rojo Fuego",
    description: "Flapper corto, tres capas de fleco rojo. Brilla al girar.",
    flavor: "«Rojo fuego. Vamos a incendiar la mesa, encanto.»",
    slot: "outfit",
    priceCoins: 3800,
    affinityBonus: 190,
  },

  {
    id: "jade-vestido-cheongsam",
    npcId: "jade",
    name: "Cheongsam de Seda Jade",
    description: "Ceñido, cuello mao, bordado con dragones dorados. Abertura larga.",
    flavor: "«Cheongsam. Sabés lo que le queda a este cuerpo.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 220,
  },

  {
    id: "bettie-vestido-cuero-negro",
    npcId: "bettie",
    name: "Gala Dorada de Lentejuelas",
    description:
      "Vestido largo art déco de lentejuelas champagne, escote profundo con fleco dorado y diadema de plumas. Puro brillo de casino.",
    flavor: "«Oro. Ahora sí te vestís para perder con clase.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 210,
  },

  {
    id: "eulalia-vestido-criollo",
    npcId: "eulalia",
    name: "Vestido Tango Oxblood",
    description:
      "Satén burdeos hasta el piso, halter, tajo altísimo hasta la cadera, encaje negro al ruedo.",
    flavor: "«Cortá corto y mirá largo. Tango, criatura.»",
    slot: "outfit",
    priceCoins: 3600,
    affinityBonus: 200,
  },
  {
    id: "eulalia-gaucha-gala",
    npcId: "eulalia",
    name: "Gaucha de Gala",
    description:
      "Blusa de seda marfil con botones de nácar, chiripá negro bordado con conchos de plata, botas de montar y facón al cinto.",
    flavor: "«Vestida pa' la pulpería y pa' la cancha.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 220,
  },

  {
    id: "vita-liga-navaja",
    npcId: "vita",
    name: "Liga con Funda para Navaja",
    description: "Encaje negro con funda de cuero cosida.",
    flavor: "«Práctico y provocador. Los dos me gustan.»",
    slot: "adornment",
    priceCoins: 1800,
    affinityBonus: 90,
  },
  {
    id: "opal-reloj-oro",
    npcId: "opal",
    name: "Reloj de Bolsillo Dorado",
    description: "Con tapa grabada. Puntual — como ella.",
    flavor: "«Reloj. Perfecto — el tiempo también se contabiliza.»",
    slot: "accessory",
    priceCoins: 2400,
    affinityBonus: 120,
  },
  {
    id: "zelda-collar-luna",
    npcId: "zelda",
    name: "Collar Media Luna de Plata",
    description: "Media luna colgante sobre cadena larga.",
    flavor: "«La luna — ya me habías visto con esto en un sueño.»",
    slot: "adornment",
    priceCoins: 2100,
    affinityBonus: 105,
  },
  {
    id: "lola-tacones-dorados",
    npcId: "lola",
    name: "Zapatos Dorados de Tacón",
    description: "Charol dorado, tacón fino, pulsera al tobillo.",
    flavor: "«Dorados. Ahora sí camino con suerte.»",
    slot: "adornment",
    priceCoins: 2400,
    affinityBonus: 120,
  },
  {
    id: "jade-pipa-larga",
    npcId: "jade",
    name: "Pipa Larga de Ébano",
    description: "Ébano negro, boquilla de jade.",
    flavor: "«Ébano y jade — combinás como debe ser.»",
    slot: "accessory",
    priceCoins: 2500,
    affinityBonus: 125,
  },
  {
    id: "bettie-collar-cadena",
    npcId: "bettie",
    name: "Cadena Gruesa de Plata",
    description: "Eslabones anchos, cierre de garra.",
    flavor: "«Cadena. Casi tan pesada como tu deuda conmigo.»",
    slot: "adornment",
    priceCoins: 2000,
    affinityBonus: 100,
  },

  {
    id: "vita-corset-cuero",
    npcId: "vita",
    name: "Corsé de Cuero Negro con Cordón Rojo",
    description:
      "Cuero negro engrasado, ojales de latón, cordón rojo sangre. Guarda dos navajas en las costuras.",
    flavor: "«Cuero y rojo. Ahora sí voy vestida para trabajar.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 210,
    portraitVariant: "vita-gift-corset-cuero",
  },
  {
    id: "jade-sombrero-dragon",
    npcId: "jade",
    name: "Sombrero Cónico Bordado en Dragones",
    description: "Seda verde jade, borlas rojas, dragones dorados enrollándose al ala.",
    flavor: "«Dragones dorados. Ahora sí me presento como corresponde.»",
    slot: "adornment",
    priceCoins: 3400,
    affinityBonus: 170,
    portraitVariant: "jade-gift-sombrero-dragon",
  },
  {
    id: "lola-vestido-flecos-negro",
    npcId: "lola",
    name: "Vestido de Flecos Negro Largo",
    description:
      "Chiffon negro, cascada de fleco de cuentas negras hasta los tobillos. Se ondula con cada apuesta.",
    flavor: "«Fleco largo, suerte larga. Regla mía.»",
    slot: "outfit",
    priceCoins: 4000,
    affinityBonus: 200,
    portraitVariant: "lola-gift-vestido-flecos-negro",
  },
  {
    id: "eulalia-sombrero-gaucho",
    npcId: "eulalia",
    name: "Sombrero Gaucho Negro",
    description:
      "Ala ancha, fieltro negro, cinta trenzada con hebilla de plata. De sótano al patio.",
    flavor: "«Sombrero criollo. Ahora hablamos el mismo idioma, che.»",
    slot: "adornment",
    priceCoins: 2400,
    affinityBonus: 120,
    portraitVariant: "eulalia-gift-sombrero-gaucho",
  },
  {
    id: "bettie-bombin-velo",
    npcId: "bettie",
    name: "Bombín Negro con Velo Corto",
    description: "Bombín de lana negra con velo de red sobre los ojos. Discreto y peligroso.",
    flavor: "«Velo. Perfecto para leerte sin que te enteres.»",
    slot: "adornment",
    priceCoins: 2600,
    affinityBonus: 130,
    portraitVariant: "bettie-gift-bombin-velo",
  },

  {
    id: "vita-mini-cuero",
    npcId: "vita",
    name: "Vestido Mini de Cuero Negro",
    description:
      "Cuero negro engrasado hasta medio muslo, cinturón con hebilla de latón, botones al frente.",
    flavor: "«Cuero corto. Ideal para trabajar de noche.»",
    slot: "outfit",
    priceCoins: 4400,
    affinityBonus: 220,
    portraitVariant: "vita-gift-mini-cuero",
  },
  {
    id: "lola-mini-flecos-dorado",
    npcId: "lola",
    name: "Mini de Flecos Dorados",
    description: "Flecos dorados en cascada sobre forro burdeos. Muy corto, brilla al bailar.",
    flavor: "«Fleco dorado. Suerte pura, encanto.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 210,
    portraitVariant: "lola-gift-mini-flecos-dorado",
  },
  {
    id: "jade-cheongsam-corto",
    npcId: "jade",
    name: "Cheongsam Corto Rojo Dragón",
    description:
      "Seda roja hasta el muslo, cuello mao, abertura lateral, bordado con dragones dorados.",
    flavor: "«Cheongsam corto. Ahora sí me estás mirando bien.»",
    slot: "outfit",
    priceCoins: 4600,
    affinityBonus: 230,
    portraitVariant: "jade-gift-cheongsam-corto",
  },

  {
    id: "opal-camison-cuadros",
    npcId: "opal",
    name: "Camisón de Cuadros del Ático",
    description:
      "Cuadrícula blanco-negro impecable, cuello alto con perla, mangas largas. Ordenado hasta el sueño.",
    flavor: "«Cuadrícula perfecta. Duermo tranquila.»",
    slot: "outfit",
    priceCoins: 2800,
    affinityBonus: 140,
    portraitVariant: "opal-gift-camison-cuadros",
  },
  {
    id: "bettie-mini-cuero-rojo",
    npcId: "bettie",
    name: "Traje de Frac con Camisa Roja",
    description:
      "Frac negro entallado sobre camisa de seda roja sangre, moño desatado, pantalón de tiro alto con tiradores. Andrógino y peligroso.",
    flavor: "«Traje de hombre y boca de mujer. Que se acostumbren.»",
    slot: "outfit",
    priceCoins: 4400,
    affinityBonus: 220,
    portraitVariant: "bettie-gift-mini-cuero-rojo",
  },
  {
    id: "eulalia-camison-criollo",
    npcId: "eulalia",
    name: "Camisón Pampas de Lino",
    description:
      "Camisón largo de gasa marfil, encaje floral al escote, chal de lana crema. Íntimo de sótano.",
    flavor: "«Encendé la vela, che, y no te pierdas.»",
    slot: "outfit",
    priceCoins: 2600,
    affinityBonus: 130,
    portraitVariant: "eulalia-gift-camison-criollo",
  },
  {
    id: "zelda-camison-oraculo",
    npcId: "zelda",
    name: "Camisón Oráculo Dorado",
    description:
      "Satén dorado largo con símbolos zodiacales en granate, mangas de campana. Para las noches de vidente.",
    flavor: "«Este ya lo había visto — pero gracias por traerlo.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 210,
    portraitVariant: "zelda-gift-camison-oraculo",
  },
  {
    id: "clara-mini-marfil",
    npcId: "clara",
    name: "Mini Marfil de Encaje Parisino",
    description:
      "Seda marfil con encaje francés en el ruedo, tres perlas al cuello, corto hasta el muslo.",
    flavor: "«Parisino, mon cher. Ganás puntos.»",
    slot: "outfit",
    priceCoins: 3600,
    affinityBonus: 180,
    portraitVariant: "clara-gift-mini-marfil",
  },
  {
    id: "luisa-camison-piel",
    npcId: "luisa",
    name: "Camisón Blanco con Piel de Zorro",
    description: "Seda blanca larga con ribete de piel blanca en cuello y puños. Ruso e imperial.",
    flavor: "«Zorro blanco. Combino con el invierno de mi país.»",
    slot: "outfit",
    priceCoins: 4200,
    affinityBonus: 210,
    portraitVariant: "luisa-gift-camison-piel",
  },
  {
    id: "lin-qipao-oxblood",
    npcId: "lin",
    name: "Qipao Oxblood con Dragón Dorado",
    description:
      "Seda oxblood ceñida, cuello mao, botones de nudo dorado y dragón bordado al costado. Elegante hasta el filo.",
    flavor: "«Oxblood y dragón. Ahora sí me mirás con respeto.»",
    slot: "outfit",
    priceCoins: 4400,
    affinityBonus: 220,
  },
  {
    id: "lin-mini-negro",
    npcId: "lin",
    name: "Mini Qipao Negro Cerezo",
    description:
      "Qipao ultra corto en seda negra, cuello mao, bordado de flor de cerezo dorada, tajos altos. Peligro puro.",
    flavor: "«Corto y negro. Hoy no vengo a contar, vengo a cobrar.»",
    slot: "outfit",
    priceCoins: 4600,
    affinityBonus: 230,
  },
];

export const HOSTESS_ROSTER: Array<{ npcId: string; name: string; role: string }> = [
  { npcId: "clara", name: "Clara Vionnet", role: "Ruleta · suplente" },
  { npcId: "bettie", name: "Black Bettie", role: "Blackjack · titular" },
  { npcId: "jade", name: "Jade «Ojo de Dragón»", role: "Mahjong · titular" },
  { npcId: "lin", name: "Lin Hoang", role: "Mahjong · suplente" },
  { npcId: "vita", name: "Vita la Cuchillas", role: "Solitario · titular" },
  { npcId: "opal", name: "Opal «Cuadrículas»", role: "Solitario · titular" },
  { npcId: "zelda", name: "Zelda «La Adivina»", role: "Generala · titular" },
  { npcId: "salome", name: "Salomé Quevedo", role: "Generala · suplente" },
  { npcId: "lola", name: "Lola «La Suerte»", role: "Bagatelle · titular" },
  { npcId: "shauna", name: "Shauna Mallory", role: "Bagatelle · suplente" },
  { npcId: "luisa", name: "Luisa Volkov", role: "Mentirosos · suplente" },
  { npcId: "eulalia", name: "Eulalia", role: "Truco · titular" },
];

export function getGiftsForNpc(npcId: string): HostessGift[] {
  return HOSTESS_GIFTS.filter((g) => g.npcId === npcId);
}

export function getGift(id: string): HostessGift | undefined {
  return HOSTESS_GIFTS.find((g) => g.id === id);
}

const OWNED_KEY = "hostess-gifts:owned:v1";
const EQUIPPED_KEY = "hostess-gifts:equipped:v1";

function readOwned(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(OWNED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr)
      ? new Set(arr.filter((x): x is string => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}
function writeOwned(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OWNED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

type EquippedMap = Record<string, Partial<Record<GiftSlot, string | null>>>;
function readEquipped(): EquippedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EQUIPPED_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as unknown;
    return obj && typeof obj === "object" ? (obj as EquippedMap) : {};
  } catch {
    return {};
  }
}
function writeEquipped(map: EquippedMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EQUIPPED_KEY, JSON.stringify(map));
  } catch {}
}

export function isGiftOwned(id: string): boolean {
  return readOwned().has(id);
}

export function getOwnedGiftIds(): string[] {
  return Array.from(readOwned());
}

export function getEquippedGiftsForNpc(npcId: string): Partial<Record<GiftSlot, string | null>> {
  return readEquipped()[npcId] ?? {};
}

export function getEquippedGiftInSlot(npcId: string, slot: GiftSlot): HostessGift | undefined {
  const id = readEquipped()[npcId]?.[slot];
  return id ? getGift(id) : undefined;
}

export interface GiftPurchaseResult {
  success: boolean;
  reason?: "no-funds" | "owned" | "unknown";
}

export function purchaseGift(
  giftId: string,
  spend: (amount: number) => boolean,
): GiftPurchaseResult {
  const gift = getGift(giftId);
  if (!gift) return { success: false, reason: "unknown" };
  if (isGiftOwned(giftId)) return { success: false, reason: "owned" };
  const ok = spend(gift.priceCoins);
  if (!ok) return { success: false, reason: "no-funds" };
  const owned = readOwned();
  owned.add(giftId);
  writeOwned(owned);
  emitChange();
  return { success: true };
}

export function equipGift(giftId: string): boolean {
  const gift = getGift(giftId);
  if (!gift || !isGiftOwned(giftId)) return false;
  const map = readEquipped();
  const npcSlots = map[gift.npcId] ?? {};
  npcSlots[gift.slot] = giftId;
  map[gift.npcId] = npcSlots;
  writeEquipped(map);
  emitChange();
  return true;
}

export function unequipGiftSlot(npcId: string, slot: GiftSlot): void {
  const map = readEquipped();
  if (!map[npcId]) return;
  map[npcId][slot] = null;
  writeEquipped(map);
  emitChange();
}

const CHANGE_EVENT = "hostess-gifts:change";
function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeGifts(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(CHANGE_EVENT, h);
  return () => window.removeEventListener(CHANGE_EVENT, h);
}
