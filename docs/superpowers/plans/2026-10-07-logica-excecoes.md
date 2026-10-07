# Lógica e exceções — Plano da etapa 2

> Origem: auditoria de 2026-10-07 (relatórios de lógica/exceções e de frontend). Escopo aprovado pelo dono: "implemente tudo". Cada tarefa = testes primeiro, depois código, suíte inteira verde, commit. Branch `feature/logica-excecoes` (a partir de `feature/horario-funcionamento`).

## Restrições globais
- Decisões já confirmadas em `CONTEXTO_PROJETO.md` continuam valendo (nunca calcular/mostrar taxa; "grátis" só com CEP e certeza; mensagem do WhatsApp sem emoji nem caractere acima de U+FFFF).
- Componentes finos; regra em services/facades. Testes não dependem de relógio real (`fakeClock`).
- Comandos: `npx ng test --watch=false --browsers=ChromeHeadless` e `npm run build`.

## Tarefas

1. **Mensagem do WhatsApp à prova de texto do cliente** (`whatsapp-message.service.ts`): `sanitizeText` (remove emoji/pares substitutos, substitutos soltos, controles e marcas bidi), `inline()` (uma linha; remove `* _ ~` e crase) para nome, endereço e observação da pizza; `block()` para observações gerais (por linha: remove marcador de citação/lista no início e `*_~\``). Testes: emoji some, `URIError` impossível, `*Entrega*` forjado neutralizado, texto normal intacto.
2. **Validação e restauração**: telefone com DDD válido e 9º dígito; UF só das 27 siglas; nome com letra e 2+ caracteres; número com dígito ou "s/n". Restaurar rascunho do checkout aplicando limites e removendo quebras; restaurar carrinho mesclando bebida duplicada, corrigindo `id` repetido e cortando observações em 300.
3. **Persistência**: validade (carrinho e montador 72 h, formulário 30 dias; sem marca de tempo = dado antigo, vale) via chave irmã `…:savedAt` e `ClockService`; sincronização entre abas pelo evento `storage` (`PersistenceService.changes$`) em carrinho, formulário e montador.
4. **Entrega grátis sem falso positivo**: a zona guarda o endereço (cidade+UF) para o qual foi calculada e só vale se ainda for o do formulário (`zone$` recalcula quando o formulário muda); CEP geral de cidade (ViaCEP sem rua) nunca é "grátis"; resultado do fallback por endereço (Nominatim) não entra no cache; trocar o CEP limpa os campos que o CEP anterior preencheu automaticamente; `timeout(6000)` em ViaCEP, AwesomeAPI e Nominatim.
5. **Fluxo de envio**: "Tentar novamente" quando o CEP falha por rede (não grava `lastLookedUpCep` no erro); espera até 3 s a zona em consulta antes de montar o link; trava de duplo clique (1,5 s); navegador embutido do Instagram/Facebook não usa `window.open` (mostra o botão "Abrir WhatsApp"); `try/catch` na geração do link; "Copiar mensagem do pedido" na tela de pedido pronto; "Fazer novo pedido" também zera o montador; ao abrir o montador, edição de pizza que já saiu do carrinho vira pizza nova; falha de carregamento de módulo após novo deploy recarrega a página.

## Fora desta etapa (registrado para depois)
Identificador/hora na mensagem do WhatsApp; troco menor que o total (preços ainda vazios); aviso de item removido por mudança de cardápio; aviso de armazenamento cheio; migração de chaves v1; Nominatim com aviso de privacidade (vai com a etapa de acessibilidade/privacidade).
