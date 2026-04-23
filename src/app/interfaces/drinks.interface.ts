export type opcoesBebida =
  | 'agua_com_gas'
  | 'agua_sem_gas'
  | 'coca'
  | 'fanta'
  | 'guarana_antarctica'
  | 'kuat'
  | 'sprite'
  | 'fanta_uva'
  | 'fanta_laranja_2l'
  | 'guarana_antarctica_1_5l'
  | 'guarana_antarctica_1l'
  | 'coca_1l'
  | 'coca_600ml';

export interface Bebida {
  tipo: opcoesBebida;
  quantidade?: number; // opcional, caso queira suportar múltiplos
}