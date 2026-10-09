import { STORE_INFO } from '../src/app/data/store-info';
import { ClockService } from '../src/app/services/clock.service';
import { getStoreStatus } from '../src/app/services/store-hours.service';

const HOUR = 3_600_000;
const responseWithDate = (epoch: number) => new Response(null, { headers: { date: new Date(epoch).toUTCString() } });

describe('ClockService: relógio do aparelho errado', () => {
  it('sem sincronizar usa o relógio do aparelho', () => {
    const clock = new ClockService();
    expect(Math.abs(clock.now() - Date.now())).toBeLessThan(50);
    expect(clock.skew).toBe(0);
  });

  it('celular 2 h ATRASADO: passa a andar com a hora do servidor', async () => {
    spyOn(window, 'fetch').and.callFake(async () => responseWithDate(Date.now() + 2 * HOUR));
    const clock = new ClockService();
    await clock.sync();
    expect(Math.abs(clock.now() - (Date.now() + 2 * HOUR))).toBeLessThan(2500);
  });

  it('celular 3 h ADIANTADO: também corrige (diferença negativa)', async () => {
    spyOn(window, 'fetch').and.callFake(async () => responseWithDate(Date.now() - 3 * HOUR));
    const clock = new ClockService();
    await clock.sync();
    expect(Math.abs(clock.now() - (Date.now() - 3 * HOUR))).toBeLessThan(2500);
  });

  it('o cabeçalho Age (resposta de cache) é ignorado: a Vercel já manda o Date com a hora atual', async () => {
    spyOn(window, 'fetch').and.callFake(
      async () => new Response(null, { headers: { date: new Date(Date.now() + 2 * HOUR).toUTCString(), age: String(5 * 3600) } })
    );
    const clock = new ClockService();
    await clock.sync();
    expect(Math.abs(clock.now() - (Date.now() + 2 * HOUR))).toBeLessThan(2500);
  });

  it('diferença pequena (rede, arredondamento do cabeçalho) é ignorada', async () => {
    spyOn(window, 'fetch').and.callFake(async () => responseWithDate(Date.now() + 5_000));
    const clock = new ClockService();
    await clock.sync();
    expect(clock.skew).toBe(0);
  });

  it('sem internet ou sem cabeçalho Date válido: nunca lança e segue com o relógio do aparelho', async () => {
    const clock = new ClockService();
    const fetchSpy = spyOn(window, 'fetch').and.rejectWith(new TypeError('Failed to fetch'));
    await expectAsync(clock.sync()).toBeResolved();
    expect(clock.skew).toBe(0);

    fetchSpy.and.callFake(async () => new Response(null));
    await expectAsync(clock.sync()).toBeResolved();
    expect(clock.skew).toBe(0);

    fetchSpy.and.callFake(async () => new Response(null, { headers: { date: 'lixo' } }));
    await clock.sync();
    expect(clock.skew).toBe(0);
  });

  it('a hora corrigida decide se a loja está aberta (celular em hora errada não bloqueia nem libera)', async () => {
    // Servidor: terça 19h (aberta). Celular: domingo 12h (fechada).
    const server = Date.parse('2026-10-06T19:00:00-03:00');
    const device = Date.parse('2026-10-04T12:00:00-03:00');
    spyOn(Date, 'now').and.returnValue(device);
    spyOn(window, 'fetch').and.callFake(async () => responseWithDate(server));
    const clock = new ClockService();
    await clock.sync();
    expect(getStoreStatus(device, STORE_INFO.schedule).open).withContext('relógio do aparelho sozinho').toBeFalse();
    expect(getStoreStatus(clock.now(), STORE_INFO.schedule).open).withContext('relógio corrigido').toBeTrue();
  });
});
