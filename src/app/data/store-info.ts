export const STORE_INFO = {
  name: 'Disk Pizza',
  since: 2015,
  /** Formato internacional exigido pelo wa.me: 55 + DDD + número. */
  whatsappNumber: '5541997449380',
  whatsappDisplay: '(41) 99744-9380',
  phoneDisplay: '(41) 3273-2145',
  /** Horário vindo da página de contatos anterior; conferir com a loja. */
  hours: 'Segunda a sábado, das 18h às 23h',
  closedOn: 'domingo',
  closedNotice: 'Fechado aos domingos',
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
