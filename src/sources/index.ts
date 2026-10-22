import type { Source } from "../types";
import { catho } from "./catho";
import { ciee } from "./ciee";
import { gupy } from "./gupy";
import { infojobs } from "./infojobs";
import { mudes } from "./mudes";
import { solides } from "./solides";
import { vagascom } from "./vagascom";

// Ordem = prioridade quando a mesma vaga aparece em mais de um site.
export const SOURCES: Source[] = [ciee, mudes, gupy, catho, vagascom, infojobs, solides];
