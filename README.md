# Editor de saves do Schedule I, fontes

O editor é um único ficheiro HTML sem dependências, tirando o JSZip, que vem por CDN.
Estes ficheiros são a versão repartida; o `build.mjs` junta-os.

## Ficheiros

| Ficheiro | O que tem |
| --- | --- |
| `shell.html` | Markup, CSS e os dois marcadores `/*CORE*/` e `/*APP*/` onde o JS é injetado |
| `core.js` | Parser e serializador de JSON compatível com o `JsonUtility` do Unity. Guarda quais números eram floats para os reescrever com `.0`, e reproduz o formato do jogo byte a byte |
| `base.js` | Constantes, utilitários de DOM e de campos, leitura e escrita do save, catálogo de itens, editor de slots, perfis Steam, HUD, navegação e exportação |
| `views.js` | Resumo, Jogadores, Contactos, Produtos, Imóveis, Veículos e Missões |
| `extra.js` | Campos automáticos, Produção, Dealers, Aparência e roupa, e Procurar |
| `tools.js` | Ferramentas, Variáveis, Ficheiros, Alterações (o diff), a tabela `VIEWS` e os eventos |

A ordem de concatenação importa: `base.js`, `views.js`, `extra.js`, `tools.js`.
O `tools.js` fica no fim porque é lá que estão os `$("...").onclick` e a tabela `VIEWS`.

## Compilar

```
node build.mjs                      # escreve ../schedule1-save-editor.html
node build.mjs /caminho/qualquer.html
```

Não há passo de empacotamento, nem transpilação, nem dependências para instalar.
Abrir o HTML resultante com duplo clique chega.

## Notas

- Todo o estado vive no objeto `S`, em `base.js`. Cada ficheiro do save é uma entrada
  em `S.entries` com o texto original, os dados analisados e uma marca de alterado.
- Só os ficheiros alterados são reescritos na exportação; os outros saem tal como entraram.
- Para acrescentar uma secção: escreve a função `viewX()`, mete-a na tabela `VIEWS`
  em `tools.js`, e acrescenta a entrada em `NAV` e o ícone em `ICONS`, em `base.js`.
- A pasta `steam-proxy` tem o proxy opcional da Steam Web API, para nomes e fotos.
