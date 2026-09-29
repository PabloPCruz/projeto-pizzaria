export const STORE_INFO = {
  name: 'Disk Pizza',
  since: 2015,
  /** Formato internacional exigido pelo wa.me: 55 + DDD + número. */
  whatsappNumber: '5541997449380',
  whatsappDisplay: '(41) 99744-9380',
  phoneDisplay: '(41) 3273-2145',
  /** Endereço e horário vindos da página de contatos anterior; conferir com a loja. */
  address: 'R. Luis Braile, 135 — Curitiba/PR',
  hours: 'Segunda a sábado, das 18h às 23h',
  closedOn: 'domingo',
  closedNotice: 'Fechado aos domingos',
  promoNotice: 'Promoção todos os dias',
  social: {
    instagram: 'https://www.instagram.com/diskpizzactba/',
    facebook: 'https://www.facebook.com/diskpizzasandra/?locale=pt_BR',
  },
} as const;
