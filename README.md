# Proposta de Visualização de Dados do NoFeling

---

## Visão Geral

O projeto **NoFeling** desenvolve uma solução baseada em algoritmos de grafos para otimizar a seleção de bases operacionais que respondem a focos de incêndio florestal. Para isso, foi organizado em **três mini-projetos de visualização de dados**:

1. **Mini Projeto 1 — Tela de carregamento com grafos**: Demonstra visualmente como o algoritmo de otimização aloca recursos.

2. **Mini Projeto 2 — Ícones Animados e Informativos no Mapa de Ocorrências**: Apresenta focos de incêndio em tempo real de forma interativa.

3. **Mini Projeto 3 — Heatmap de ocorrências por municípios**: Oferece inteligência geoespacial para decisões estratégicas sobre realocação de recursos.

---

## Sumário


1. [Visão Geral](#visão-geral)
2. [Mini Projeto 1 - Tela de carregamento com grafos](#mini-projeto-1)
3. [Mini Projeto 2 - Ícones Animados e Informativos no Mapa de Ocorrências](#mini-projeto-2)
4. [Mini Projeto 3 - Heatmap de ocorrências](#heatmap-de-ocorrências)
5. [Equipes Responsáveis](#equipes-responsáveis)


---


## Tela de carregamento com grafos


### Descrição


Essa visualização detalha brevemente uma simulação de como o algoritmo funciona. Alocando os rastreadores (bolinhas  a esquerda) às suas respectivas logísticas (bolinhas no meio) e, por fim, às unidades de produção (bolinhas a direita).


### Visualizações Geradas


#### Visualização 1 - Tela de carregamento com grafos


| Campo            | Detalhe                              |
|------------------|--------------------------------------|
| **Tipo**         | Grafo |
| **Fonte de dados** | Nome da base ou tabela utilizada   |
| **Ferramenta**   | D3   |




**Exemplo de uso:** Poderá ser utilizado tanto para auxiliar visualmente na apresentação, quanto substituir a tela (load scene) de carregamento do algoritmo.


---


### Equipe Responsável


| Nome              |
|-------------------|
| Maria Eduarda Oliveira  |
|    Pedro Siqueira     |
|     Thúlio Bacco    |


---


## Icones Animados e Informativos no Mapa de Ocorrências


### Descrição


Essa visualização detalha brevemente no mapa as informações de icones e ocorrências.

### Visualizações Geradas


#### Visualização 2 — Icones Animados e Informativos no Mapa de Ocorrências


| Campo            | Detalhe                              |
|------------------|--------------------------------------|
| **Tipo**         | Mapa |
| **Fonte de dados** | Nome da base ou tabela utilizada   |
| **Ferramenta**   | D3  |


**Exemplo de uso:** Poderá ser utilizado tanto para auxiliar visualmente na apresentação, quanto substituir a tela (ocurrency map) de mapa de occorrências.


---


### Equipe Responsável


| Nome              |
|-------------------|
| Victor Garcia Dos Santos |
|    Rafael Ryu Tati Nakahara     |


---


## Heatmap de ocorrências


### Descrição

Esta visualização foi desenvolvida especificamente para atender à persona de **Douglas Guedes, Gerente Executivo de Inteligência Patrimonial**. O objetivo é oferecer uma leitura executiva da distribuição de incêndios, permitindo identificar as regiões com maior concentração de ocorrências por meio de um heatmap.

No contexto ideal do projeto maior, a aplicação seria voltada para a análise de mais ocorrências por Unidade Produtiva. Como não temos dados exatos das UPs neste momento, o recorte adotado nesta entrega será o de mais ocorrências por cidades do Mato Grosso do Sul.

**Relevância para o projeto de otimização de alocação de recursos:** 

Embora este heatmap não seja diretamente uma solução de otimização, ele serve como ferramenta crítica de inteligência para apoiar a tomada de decisão executiva. A visualização permite que gestores como Douglas identifiquem rapidamente os pontos geográficos com maior densidade de incêndios, capacitando-os a propor novas localizações para posicionar recursos (bases, equipamentos e equipes) de forma estratégica. Quando novos recursos são alocados em posições baseadas nessa análise de hotspots, a efetividade geral da resposta aumenta, resultando em otimização indireta da alocação. Este efeito é especialmente pronunciado durante períodos de pico de incêndios, onde a qualidade da distribuição de recursos é mais crítica.

**Proposta de evolução:** Para potencializar ainda mais o valor analítico desta visualização, sugere-se a implementação de um filtro temporal (barra de progressão deslizável) que permita aos executivos navegar através dos períodos históricos. Conforme o usuário avança ou retrocede na linha do tempo, o heatmap se atualiza dinamicamente para refletir a distribuição de incêndios naquele período específico, revelando padrões sazonais e tendências que informam decisões ainda mais precisas sobre posicionamento de recursos.


### Visualizações Geradas


#### Visualização 3.1 — Heatmap de ocorrências por cidades do MS


| Campo            | Detalhe                              |
|------------------|--------------------------------------|
| **Tipo**         | Mapa coroplético (heatmap) com sobreposição de bolhas proporcionais |
| **Fonte de dados** | Incêndios por UP (incendios_ups.csv), localização de fazendas/UPs (Fazendas_MS.csv), e geometrias de municípios MS (via GeoJSON e API IBGE) |
| **Ferramenta**   | D3.js v7, JavaScript, HTML5 Canvas |


**Implementação técnica:**

O heatmap agrupa ocorrências de incêndios por município através de um pipeline de processamento geoespacial:

1. **Carregamento de dados**: Integra dados de três fontes — (a) arquivo CSV com histórico de incêndios por UP, incluindo área queimada; (b) coordenadas geográficas das Unidades Produtivas; (c) mapas GeoJSON dos municípios de MS.

2. **Geolocalização e agregação**: Para cada incêndio registrado, determina o município correspondente usando `d3.geoContains()` (testa se as coordenadas da UP caem dentro dos limites municipais), agrupa por município e acumula ocorrências e área total queimada.

3. **Codificação visual**: Utiliza escala de cores (escala quantitativa) para colorir cada município conforme a densidade de incêndios — municípios com mais ocorrências recebem cores mais saturadas, enquanto áreas sem dados permanecem neutras. Além disso, renderiza bolhas proporcionais (size encoding) para reforçar visualmente a magnitude das ocorrências.

4. **Interatividade**: Tooltip flutuante que exibe ao passar o mouse informações detalhadas de cada município (número de ocorrências, área afetada, microrregião, UPs envolvidas).

**Exemplo de uso:** Executivos e gestores utilizam este heatmap para identificar rapidamente os municípios e regiões com maior recorrência de incêndios. Com essa inteligência geográfica, conseguem propor estrategicamente novos pontos de apoio, reposicionamento de equipes e realocação de recursos (equipamentos, veículos, pessoal) para áreas de maior demanda. A abordagem baseada em dados reduz desperdícios de recursos em zonas de baixa ocorrência e concentra esforços onde são mais necessários, contribuindo para otimização indireta da alocação de recursos. A futura inclusão de filtro temporal amplificaria este valor, permitindo análise de padrões sazonais e resposta adaptativa a ondas de incêndios.


---


###  Equipe Responsável


| Nome              |
|-------------------|
| Maria Clara Oliveira  |
|    Messias Olivindo     |


---


## Equipes Responsáveis


Visão consolidada de todas as equipes envolvidas no projeto.


| Mini Projeto      | Equipe       |
|-------------------|----------------------|
| Tela de carregamento com grafos    | Maria Eduarda, Pedro SIqueira e Thúlio Bacco       |
| Icones Animados e Informativos no Mapa de Ocorrências   | Victor Garcia Dos Santos, Rafael Ryu Tati Nakahara      |
| Heatmap de ocorrências    | Maria Clara Oliveira e Messias Olivindo       |




---
