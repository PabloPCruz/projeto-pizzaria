export const STORE_INFO = {
  name: 'Disk Pizza',
  since: 2015,
  /** Formato internacional exigido pelo wa.me: 55 + DDD + número. */
  whatsappNumber: '5541997449380',
  whatsappDisplay: '(41) 99744-9380',
  phoneDisplay: '(41) 3273-2145',
  /** Horário de funcionamento (a fonte da regra e dos textos exibidos). Datas fechadas: 'AAAA-MM-DD'. */
  schedule: {
    timeZone: 'America/Sao_Paulo',
    openDays: [1, 2, 3, 4, 5, 6],
    opensAt: '18:00',
    closesAt: '23:00',
    closedDates: [] as string[],
  },
  promoNotice: 'Promoção todos os dias',
  /**
   * Entrega grátis para endereços a até `radiusKm` da loja, em linha reta (360°).
   * `origin` é o ponto da loja (Rua Luiz Braille, 135 — CEP 82015-290, Curitiba/PR),
   * usado só para o cálculo: o endereço não é exibido no site.
   */
  freeDelivery: {
    origin: { lat: -25.4112507, lng: -49.3373821 },
    radiusKm: 3,
  },
  social: {
    instagram: 'https://www.instagram.com/diskpizzactba/',
    facebook: 'https://www.facebook.com/diskpizzasandra/?locale=pt_BR',
  },
} as const;
