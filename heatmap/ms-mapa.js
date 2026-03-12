/**
 * Mapa de Mato Grosso do Sul (MS) - D3.js
 * Seguindo a estrutura do repositório: https://github.com/adolfoguimaraes/mapas_dataset
 * 
 * Variáveis seguindo o padrão do autor:
 * - br_map: Mapa completo do Brasil (5570 municípios)
 * - states_map: Mapa dos estados (27 UFs)
 * - states_arr: Array com siglas dos estados
 * - br_map_filter: Municípios filtrados do estado selecionado
 * - br_state_filter: Contorno do estado selecionado
 */

// Configurações
const CONFIG = {
    width: 900,
    height: 700,
    state: "MS",
    stateCode: "50", // Código IBGE de MS

    // URLs do repositório adolfoguimaraes/mapas_dataset (usando media.githubusercontent para arquivos LFS)
    urls: {
        br_map: "https://media.githubusercontent.com/media/adolfoguimaraes/mapas_dataset/main/brasil/BR_Municipios_2020_small.json",
        states_map: "https://media.githubusercontent.com/media/adolfoguimaraes/mapas_dataset/main/brasil/BR_UF_2020_small.json",
        municipios_ibge: "https://servicodados.ibge.gov.br/api/v1/localidades/estados/50/municipios"
    },

    // Cores acessíveis (testadas para deficientes visuais) - do autor
    map_colors: {
        0: { color: "#F0F0F0", label: "Sem dados" },
        1: { color: "#267800", label: "Nível 1" },
        2: { color: "#449ddb", label: "Nível 2" },
        3: { color: "#fdb462", label: "Nível 3" }
    }
};

// Variáveis globais seguindo padrão do autor
let br_map = null;           // Mapa completo do Brasil (5570 municípios)
let states_map = null;       // Mapa dos estados (27 UFs)
let states_arr = [];         // Array com siglas dos estados
let br_map_filter = [];      // Municípios filtrados do estado selecionado
let br_state_filter = [];    // Contorno do estado selecionado
let municipiosData = {};     // Dados dos municípios (nome, região, etc)

// Inicialização
async function init() {
    try {
        showLoading("Carregando dados dos mapas...");

        // Carrega todos os dados em paralelo
        const [brMapResponse, statesMapResponse, municipiosResponse] = await Promise.all([
            d3.json(CONFIG.urls.br_map),
            d3.json(CONFIG.urls.states_map),
            d3.json(CONFIG.urls.municipios_ibge)
        ]);

        // Mapa completo do Brasil (municípios)
        br_map = brMapResponse;
        console.log("br_map =", { type: br_map.type, features: `Array(${br_map.features.length})` });

        // Mapa dos estados
        states_map = statesMapResponse;
        console.log("states_map =", { type: states_map.type, features: `Array(${states_map.features.length})` });

        // Array com siglas dos estados
        states_arr = states_map.features.map(f => f.properties.SIGLA_UF).sort();
        console.log("states_arr =", states_arr);

        // Filtra municípios de MS (código começa com 50)
        br_map_filter = br_map.features.filter(d =>
            String(d.properties.CD_MUN).startsWith(CONFIG.stateCode)
        );
        console.log("br_map_filter =", `Array(${br_map_filter.length})`, br_map_filter.slice(0, 3));

        // Filtra o contorno do estado MS
        br_state_filter = states_map.features.filter(d =>
            d.properties.SIGLA_UF === CONFIG.state
        );
        console.log("br_state_filter =", `Array(${br_state_filter.length})`, br_state_filter);

        // Mapeia códigos para nomes de municípios
        municipiosResponse.forEach(m => {
            municipiosData[m.id] = {
                nome: m.nome,
                microrregiao: m.microrregiao?.nome || '',
                mesorregiao: m.microrregiao?.mesorregiao?.nome || ''
            };
        });

        // Atualiza UI
        hideLoading();
        document.getElementById('legend').style.display = 'flex';
        document.getElementById('info-panel').style.display = 'block';
        document.getElementById('total-municipios').textContent = br_map_filter.length;
        document.getElementById('total-brasil').textContent = br_map.features.length;

        // Renderiza os mapas
        renderStateMap();
        renderMunicipiosMap();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError(error.message);
    }
}

// Renderiza o contorno do estado
function renderStateMap() {
    const container = document.getElementById('state-map-container');
    const width = 300;
    const height = 300;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // GeoJSON do estado
    const stateGeoJSON = {
        type: "FeatureCollection",
        features: br_state_filter
    };

    const projection = d3.geoMercator()
        .fitSize([width - 20, height - 20], stateGeoJSON);

    const path = d3.geoPath().projection(projection);

    // Desenha o estado
    svg.selectAll('.state')
        .data(br_state_filter)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', '#449ddb')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('transform', 'translate(10, 10)');

    // Título
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text('Contorno de MS');
}

// Renderiza o mapa dos municípios
function renderMunicipiosMap() {
    const container = document.getElementById('map-container');

    const svg = d3.select(container)
        .append('svg')
        .attr('width', CONFIG.width)
        .attr('height', CONFIG.height)
        .attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`)
        .style('max-width', '100%')
        .style('height', 'auto');

    // GeoJSON dos municípios filtrados
    const municipiosGeoJSON = {
        type: "FeatureCollection",
        features: br_map_filter
    };

    const projection = d3.geoMercator()
        .fitSize([CONFIG.width - 60, CONFIG.height - 60], municipiosGeoJSON);

    const path = d3.geoPath().projection(projection);

    // Escala de cores
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, br_map_filter.length]);

    // Cria tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'tooltip');

    // Desenha municípios
    svg.selectAll('.municipio')
        .data(br_map_filter)
        .enter()
        .append('path')
        .attr('class', 'municipio')
        .attr('d', path)
        .attr('fill', (d, i) => colorScale(i))
        .attr('transform', 'translate(30, 30)')
        .on('mouseover', function (event, d) {
            const codigo = d.properties.CD_MUN;
            const info = municipiosData[codigo] || {};
            const nome = info.nome || d.properties.NM_MUN || 'Município ' + codigo;

            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${nome}</strong>
                    <div>Código IBGE: ${codigo}</div>
                    ${info.microrregiao ? `<div>Microrregião: ${info.microrregiao}</div>` : ''}
                    ${info.mesorregiao ? `<div>Mesorregião: ${info.mesorregiao}</div>` : ''}
                `);

            d3.select(this)
                .raise()
                .attr('fill', '#ff9800');
        })
        .on('mousemove', function (event) {
            const [x, y] = d3.pointer(event, container);
            tooltip
                .style('left', (x + 15) + 'px')
                .style('top', (y - 10) + 'px');
        })
        .on('mouseout', function (event, d) {
            tooltip.style('opacity', 0);
            const index = br_map_filter.indexOf(d);
            d3.select(this).attr('fill', colorScale(index));
        })
        .on('click', function (event, d) {
            const codigo = d.properties.CD_MUN;
            const info = municipiosData[codigo] || {};
            console.log('Município clicado:', {
                codigo,
                nome: info.nome || d.properties.NM_MUN,
                microrregiao: info.microrregiao,
                mesorregiao: info.mesorregiao,
                properties: d.properties
            });
        });

    // Título
    svg.append('text')
        .attr('x', CONFIG.width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(`Municípios de Mato Grosso do Sul (${br_map_filter.length})`);
}

// Funções auxiliares de UI
function showLoading(message) {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div class="error">
            <p>❌ Erro ao carregar o mapa</p>
            <p style="font-size: 12px; margin-top: 10px;">${message}</p>
        </div>
    `;
}

// Função para obter informações dos dados carregados (debug)
function getDataInfo() {
    return {
        br_map: br_map ? { type: br_map.type, features: br_map.features.length } : null,
        states_map: states_map ? { type: states_map.type, features: states_map.features.length } : null,
        states_arr: states_arr,
        br_map_filter: br_map_filter.length,
        br_state_filter: br_state_filter.length,
        municipiosData: Object.keys(municipiosData).length
    };
}

// Exporta variáveis globais para uso no console (como no ObservableHQ)
window.br_map = () => br_map;
window.states_map = () => states_map;
window.states_arr = () => states_arr;
window.br_map_filter = () => br_map_filter;
window.br_state_filter = () => br_state_filter;
window.municipiosData = () => municipiosData;
window.getDataInfo = getDataInfo;
window.map_colors = CONFIG.map_colors;

// Inicia a aplicação
init();
