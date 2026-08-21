export type Mood = "idle" | "spin" | "win" | "lose" | "jackpot";

export const LINES = {
  idle: [
    "Hagan juego, encantos. La rueda no espera a nadie.",
    "Treinta y siete números. Sólo uno paga. Elegí con calma.",
    "Ponga la ficha donde le diga el corazón… o el bolsillo.",
  ],
  spin: [
    "La rueda gira. Nadie respira.",
    "Cerrá los ojos si querés. Yo igual te miro perder.",
    "Aire, encanto. La bola elige a quién besar.",
  ],
  win: [
    "La casa paga. Por hoy.",
    "Bien jugado. La próxima te toca a vos invitar el martini.",
    "Suerte de pibe. Aprovechá antes que se vaya.",
  ],
  jackpot: [
    "¡Pleno! Madame Corvina va a querer una palabra con vos.",
    "Treinta y cinco a uno. Casi me caigo del taburete.",
    "Ay, querido. Eso fue una declaración de amor de la bola.",
  ],
  lose: [
    "Treinta y siete maneras de perder, encanto. Encontraste otra.",
    "La rueda no tiene memoria. Vos sí. Otra vuelta.",
    "Pasen y vean: así se funde una herencia, caballero.",
  ],
} satisfies Record<Mood, string[]>;

export const STREAK_LINES = {
  red: [
    "Cuatro rojos seguidos. La rueda tiene fiebre.",
    "Sigue el bordó. ¿O te animás a romper la racha?",
  ],
  black: [
    "El ala del cuervo no afloja. Cuatro negros.",
    "Cuatro de luto. La casa respira tranquila.",
  ],
};

export const HOT_HIT_LINES = [
  "¡El número de la noche! Madame va a sonreír… por una vez.",
  "Caíste justo donde Corvina marcó con tinta dorada. Ese paga doble.",
];

export const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
