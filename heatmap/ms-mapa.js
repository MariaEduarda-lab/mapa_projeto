/**
 * Proportional Symbol Map (Bubbles) - Incêndios MS
 */

const CONFIG = {
    width: 900, height: 700, state: "MS", stateCode: "50",
    urls: {
        br_map: "https://media.githubusercontent.com/media/adolfoguimaraes/mapas_dataset/main/brasil/BR_Municipios_2020_small.json",
        states_map: "https://media.githubusercontent.com/media/adolfoguimaraes/mapas_dataset/main/brasil/BR_UF_2020_small.json",
        municipios_ibge: "https://servicodados.ibge.gov.br/api/v1/localidades/estados/50/municipios",
        ups_csv: "data/Fazendas_MS 1.xlsx - Planilha2.csv",
        incendios_csv: "data/incendios_ups.csv"
    },
    corSemDados: "#e2e2e2" // Fundo neutro
};

let br_map = null, states_map = null, states_arr = [];
let br_map_filter = [], br_state_filter = [], municipiosData = {};
let ups_data = [], incendios_data = [], incendiosPorMunicipio = {};

function parseCoord(str) {
    if (!str) return NaN;
    return parseFloat(String(str).replace(',', '.'));
}

async function init() {
    try {
        showLoading("Carregando mapas e agrupando ocorrências...");

        const [brMapR, statesMapR, munR, upsR, incR] = await Promise.all([
            d3.json(CONFIG.urls.br_map),
            d3.json(CONFIG.urls.states_map),
            d3.json(CONFIG.urls.municipios_ibge),
            d3.csv(CONFIG.urls.ups_csv),
            d3.csv(CONFIG.urls.incendios_csv)
        ]);

        br_map = brMapR; states_map = statesMapR;
        br_map_filter = br_map.features.filter(d => String(d.properties.CD_MUN).startsWith(CONFIG.stateCode));
        br_state_filter = states_map.features.filter(d => d.properties.SIGLA_UF === CONFIG.state);

        munR.forEach(m => {
            municipiosData[m.id] = { nome: m.nome, microrregiao: m.microrregiao?.nome || '' };
        });

        ups_data = upsR.map(d => ({
            up: d.UP, fazenda: d.FAZENDA,
            lon: parseCoord(d.x), lat: parseCoord(d.y)
        })).filter(d => !isNaN(d.lon));

        incendios_data = incR;

        const incendiosPorUP = d3.rollup(
            incendios_data,
            v => ({ total: v.length, areaTotal: d3.sum(v, d => parseFloat(d.AREA_QUEIMADA_HA) || 0) }),
            d => d.UP
        );

        showLoading("Povoando bolhas...");
        incendiosPorMunicipio = {};

        ups_data.forEach(up => {
            const incUP = incendiosPorUP.get(up.up);
            if (!incUP || incUP.total === 0) return;

            const m = br_map_filter.find(f => d3.geoContains(f, [up.lon, up.lat]));
            if (m) {
                const cd = m.properties.CD_MUN;
                if (!incendiosPorMunicipio[cd]) incendiosPorMunicipio[cd] = { total: 0, areaTotal: 0, ups: [] };
                incendiosPorMunicipio[cd].total += incUP.total;
                incendiosPorMunicipio[cd].areaTotal += incUP.areaTotal;
                incendiosPorMunicipio[cd].ups.push(up.up);
            }
        });

        hideLoading();
        document.getElementById('legend').style.display = 'block';
        document.getElementById('info-panel').style.display = 'block';
        document.getElementById('fire-stats').style.display = 'block';
        document.getElementById('total-municipios').textContent = br_map_filter.length;
        document.getElementById('total-brasil').textContent = br_map.features.length;
        document.getElementById('total-ocorrencias').textContent = d3.sum(Object.values(incendiosPorMunicipio), d => d.total);
        document.getElementById('total-area').textContent = Math.round(d3.sum(Object.values(incendiosPorMunicipio), d => d.areaTotal)).toLocaleString('pt-BR') + ' ha';
        document.getElementById('municipios-afetados').textContent = Object.keys(incendiosPorMunicipio).length;

        renderStateMap();
        renderHeatmap();

    } catch (e) {
        showError(e.message);
    }
}

function renderStateMap() {
    const cont = document.getElementById('state-map-container');
    cont.innerHTML = '';
    const width = 268, height = 240;
    const svg = d3.select(cont).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
    
    const proj = d3.geoMercator().fitSize([width-20, height-30], { type: "FeatureCollection", features: br_state_filter });
    const path = d3.geoPath().projection(proj);

    const g = svg.append('g').attr('transform', 'translate(10, 20)');

    g.selectAll('.state').data(br_state_filter).enter().append('path')
        .attr('class', 'state').attr('d', path)
        .attr('fill', '#ccd6eb').attr('stroke', '#fff').attr('stroke-width', 1.5);

    const maxI = d3.max(Object.values(incendiosPorMunicipio), d => d.total) || 1;
    const rScale = d3.scaleSqrt().domain([0, maxI]).range([1.5, 9]);

    const mBubbles = Object.keys(incendiosPorMunicipio).map(cd => {
        const feat = br_map_filter.find(f => f.properties.CD_MUN === cd);
        if(!feat) return null;
        return { total: incendiosPorMunicipio[cd].total, coord: path.centroid(feat) };
    }).filter(d => d && !isNaN(d.coord[0]));
    
    mBubbles.sort((a,b) => b.total - a.total);

    g.selectAll('.mini-bubble').data(mBubbles).enter().append('circle')
        .attr('cx', d => d.coord[0]).attr('cy', d => d.coord[1])
        .attr('r', d => rScale(d.total))
        .attr('fill', '#e53935').attr('fill-opacity', 0.6)
        .attr('stroke', '#fff').attr('stroke-width', 0.5)
        .attr('pointer-events', 'none');

    svg.append('text').attr('x', width/2).attr('y', 15).attr('text-anchor', 'middle')
        .attr('font-size', '13px').attr('font-weight', 'bold').attr('fill', '#333').text('Regiões Atingidas');
}

function renderHeatmap() {
    const cont = document.getElementById('map-container');
    const oldSvg = cont.querySelector('svg');
    if (oldSvg) oldSvg.remove();

    const svg = d3.select(cont).append('svg').attr('width', CONFIG.width).attr('height', CONFIG.height).attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`).style('max-width', '100%').style('height', 'auto');
    
    const proj = d3.geoMercator().fitSize([CONFIG.width-60, CONFIG.height-80], { type: "FeatureCollection", features: br_map_filter });
    const path = d3.geoPath().projection(proj);

    const g = svg.append('g').attr('transform', 'translate(30, 40)');
    
    let tooltip = d3.select(cont).select('.tooltip');
    if(tooltip.empty()) tooltip = d3.select(cont).append('div').attr('class', 'tooltip');

    g.selectAll('.municipio').data(br_map_filter).enter().append('path')
        .attr('class', 'municipio').attr('d', path)
        .attr('fill', CONFIG.corSemDados)
        .attr('stroke', '#fff').attr('stroke-width', 0.8)
        .on('mouseover', function(){ d3.select(this).attr('fill', '#d4d4d4'); })
        .on('mouseout', function(){ d3.select(this).attr('fill', CONFIG.corSemDados); });

    const bubbles = Object.keys(incendiosPorMunicipio).map(cd => {
        const feat = br_map_filter.find(f => f.properties.CD_MUN === cd);
        if(!feat) return null;
        const [x, y] = path.centroid(feat);
        return {
            cd, x, y,
            nome: municipiosData[cd]?.nome || feat.properties.NM_MUN,
            micro: municipiosData[cd]?.microrregiao,
            total: incendiosPorMunicipio[cd].total,
            areaTotal: incendiosPorMunicipio[cd].areaTotal,
            upsCount: incendiosPorMunicipio[cd].ups.length
        };
    }).filter(d => d && !isNaN(d.x));

    bubbles.sort((a,b) => b.total - a.total);

    const maxI = d3.max(bubbles, d => d.total) || 1;
    const rScale = d3.scaleSqrt().domain([0, maxI]).range([4, 38]);

    g.selectAll('.bubble').data(bubbles).enter().append('circle')
        .attr('class', 'bubble')
        .attr('cx', d => d.x).attr('cy', d => d.y).attr('r', d => rScale(d.total))
        .attr('fill', '#e53935').attr('fill-opacity', 0.55).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke', '#333').attr('stroke-width', 2).attr('fill-opacity', 0.9).raise();
            
            tooltip.style('opacity', 1).html(`
               <strong>🔥 ${d.nome}</strong>
               <div class="tt-row"><span>Ocorrências unidas:</span><b>${d.total}</b></div>
               <div class="tt-row"><span>Área estim.:</span><b>${Math.round(d.areaTotal).toLocaleString('pt-BR')} ha</b></div>
               <div class="tt-row"><span>UPs com focos:</span><b>${d.upsCount}</b></div>
               ${d.micro ? `<div class="tt-row"><span>Região:</span><b>${d.micro}</b></div>`:''}
            `);
        })
        .on('mousemove', function(event) {
            const [x, y] = d3.pointer(event, cont);
            tooltip.style('left', (x + 16) + 'px').style('top', (y - 12) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1.5).attr('fill-opacity', 0.55);
            tooltip.style('opacity', 0);
        });

    svg.append('text').attr('x', CONFIG.width/2).attr('y', 25).attr('text-anchor', 'middle')
        .attr('font-size', '18px').attr('font-weight', 'bold').attr('fill', '#222')
        .text('Mapa de Bolhas (Proportional Symbol) - MS');

    renderProportionalLegend(svg, rScale, maxI);
}

function renderProportionalLegend(svg, rScale, maxVal) {
    const values = [Math.max(1, Math.ceil(maxVal*0.1)), Math.ceil(maxVal*0.5), maxVal].filter((v,i,a)=> a.indexOf(v)===i);
    const lgX = CONFIG.width - 120, lgY = CONFIG.height - 40;
    const g = svg.append('g').attr('transform', `translate(${lgX}, ${lgY})`);

    g.append('text').attr('y', -(rScale(maxVal)*2) - 15).attr('text-anchor','middle')
     .attr('font-size','12px').attr('fill','#444').attr('font-weight', 'bold').text('Ocorrências');

    g.selectAll('circle.legend-c').data(values).enter().append('circle')
     .attr('class', 'legend-c')
     .attr('cy', d => -rScale(d)).attr('r', d => rScale(d))
     .attr('fill', 'none').attr('stroke', '#999').attr('stroke-dasharray', '2,2');
    
    g.selectAll('line.legend-l').data(values).enter().append('line')
     .attr('class', 'legend-l')
     .attr('x1', 0).attr('y1', d => -rScale(d)*2).attr('x2', 45).attr('y2', d => -rScale(d)*2)
     .attr('stroke', '#aaa').attr('stroke-dasharray', '2,2');

    g.selectAll('text.val').data(values).enter().append('text')
     .attr('class', 'val')
     .attr('x', 50).attr('y', d => -rScale(d)*2 + 4)
     .attr('font-size', '11px').attr('fill', '#444').text(d => d);
}

function showLoading(msg) {
    const el = document.getElementById('loading');
    el.style.display = 'block'; el.innerHTML = `<div class="loading-spinner"></div><p>${msg}</p>`;
}
function hideLoading() { document.getElementById('loading').style.display = 'none'; }
function showError(msg) { document.getElementById('loading').innerHTML = `<div class="error"><p>Erro</p><p style="font-size:12px;">${msg}</p></div>`; }

init();
