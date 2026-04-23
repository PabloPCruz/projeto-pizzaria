export interface Borda {
  tipo: 'chedar' | 'catupiry' | 'chocolate';
  subtipo?: 'ao leite' | 'branco' | undefined | any; // só se tipo = chocolate
}
