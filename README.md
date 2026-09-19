# Editor de saves para Schedule I

Editor de saves do [Schedule I](https://store.steampowered.com/app/3164500/) que corre inteiramente no browser.
Sem servidor, sem instalação, sem upload: o save nunca sai do teu computador.

O jogo exporta e importa saves em `.zip` a partir do menu principal, e este editor encaixa nesse fluxo:

1. **Exportar** — no menu do jogo, Continuar e Exportar no save que queres.
2. **Editar** — abre esse `.zip` aqui.
3. **Importar** — descarrega o `.zip` editado e usa Importar no mesmo menu.

Também aceita a pasta `SaveGame_N` diretamente, em
`%USERPROFILE%\AppData\LocalLow\TVGS\Schedule I\Saves\<SteamID>\`.

## O que faz

| Secção | O que dá para fazer |
| --- | --- |
| Resumo | Nome da organização, dinheiro, património, limite do multibanco, rank e níveis, regiões, dia e hora, polícia, cartel e esgotos |
| Jogadores | Dinheiro em mão, inventário, posição (teleporte), aparência, roupa, e nome e foto da Steam por jogador |
| Contactos | Relação, desbloqueio, dependência, mortes e ressurreições, e clientes especiais (0.4.7) |
| Dealers | Recrutamento, dinheiro, clientes atribuídos, transbordo e bolsos |
| Produtos | Preços, nomes, efeitos, favoritos, e criação de produtos novos com receita opcional |
| Imóveis | Posse, lavagem de dinheiro, empregados, armazenamentos e todos os objetos colocados |
| Produção | Vasos, camas de cogumelos, secadores, fornos, caldeirões e estações de mistura, química e embalagem |
| Veículos | Acrescentar, remover, cor e bagageira |
| Entregas | Encomendas a caminho, histórico e stock das lojas |
| Missões | Estado de missões, passos e contratos |
| Ferramentas | Dinheiro, rank, imóveis, contactos, produção, lixo, graffitis, mensagens, e predefinições reutilizáveis |
| Diagnóstico | Deteta valores impossíveis e inconsistências, com correção automática, e gera um relatório do save |
| Números | Gráficos de relações, dependência, negócios, produtos e stock |
| Procurar | Procura texto em todos os ficheiros, incluindo o JSON aninhado dentro de strings |
| Outro save | Compara dois saves campo a campo e copia coisas de um para o outro |
| Variáveis / Ficheiros | Flags internas e edição direta do JSON, com validação |
| Alterações | Diff completo do que muda antes de exportares, com reposição por ficheiro |

Mais: desfazer e refazer (Ctrl+Z / Ctrl+Y), tema claro e escuro, Ctrl+K para procurar, Ctrl+S para descarregar.

## A parte chata que importa

O jogo guarda os saves em JSON escrito pelo `JsonUtility` do Unity, com uma particularidade: os
floats são sempre escritos com casa decimal (`5.0`), e há JSON aninhado dentro de strings, às vezes
com três níveis de profundidade.

O `JSON.parse` do JavaScript perde essa informação e devolveria `5`, o que muda todos os ficheiros
que o editor toca. Por isso o `src/core.js` tem um parser e um serializador próprios que:

- registam quais números eram floats, para os reescrever com `.0`;
- preservam o formato de cada nível aninhado (compacto ou indentado);
- reproduzem o estilo do jogo byte a byte.

Verificado num save real: 41 ficheiros e 2219 strings aninhadas passam o teste de ida e volta.
Os ficheiros que não editas saem do zip exatamente como entraram.

## Correr e compilar

Não há dependências para instalar nem passo de empacotamento.

```bash
# usar como site estático (ou abrir index.html com duplo clique)
python3 -m http.server 8000

# gerar o ficheiro único autocontido
node build.mjs            # escreve dist/schedule1-save-editor.html
```

O `dist/schedule1-save-editor.html` é o editor inteiro num ficheiro, para mandar a alguém ou
guardar offline. A única dependência externa é o JSZip, carregado por CDN.

## Estrutura

```
index.html            página que carrega os fontes separados
build.mjs             junta tudo num ficheiro único
src/shell.html        markup e CSS, com os marcadores onde o JS é injetado
src/core.js           parser e serializador compatíveis com o Unity
src/base.js           estado, leitura e escrita do save, slots, perfis, HUD, exportação
src/views.js          Resumo, Jogadores, Contactos, Produtos, Imóveis, Veículos, Missões
src/extra.js          campos automáticos, Produção, Dealers, Aparência e conversor de formato
src/extra2.js         Entregas, Diagnóstico, Relatório, Outro save
src/extra3.js         Histórico, Predefinições, Criação de produtos, Números
src/extra4.js         Teleporte, Objetos, Efeitos, Esgotos, Conforto
src/tools.js          Ferramentas, Variáveis, Ficheiros, Alterações, tabela VIEWS e eventos
steam-proxy/          proxy opcional da Steam Web API (Cloudflare Worker ou Express)
```

A ordem de concatenação importa: `tools.js` fica no fim porque é lá que estão os eventos e a
tabela `VIEWS`. Para acrescentar uma secção: escreve `viewX()`, mete-a em `VIEWS` (`tools.js`),
e acrescenta a entrada em `NAV` e o ícone em `ICONS` (`base.js`).

## Nomes e fotos da Steam

O save guarda apenas o SteamID. O nome e a foto podem ser definidos à mão em cada jogador e ficam
guardados no browser, ou vir automaticamente da Steam Web API através de um proxy teu
(`steam-proxy/`), porque a Steam não envia cabeçalhos CORS e a chave não pode ficar no cliente.

## Compatibilidade

Testado com saves das versões `0.4.6f13` e `0.4.7f5`. O editor não assume campos fixos: lê o que
está no ficheiro, por isso campos novos aparecem à mesma. A versão 0.4.7 mudou o formato das
aparências, e há um conversor nos dois sentidos, com cópia de segurança para reposição exata.

## Avisos

- Guarda sempre o `.zip` original antes de importar um save editado.
- O jogo tem de estar fechado enquanto editas, senão reescreve o save por cima.
- Editar um save não é suportado pelo jogo. Se partires alguma coisa, o problema é teu e do editor,
  não do TVGS.

## Licença

MIT. Ver [LICENSE](LICENSE).

Projeto não oficial, sem qualquer ligação a TVGS ou ao Schedule I.
