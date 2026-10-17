document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const btnAsync = document.getElementById('btnAsync');
    const btnThen = document.getElementById('btnThen');
    const secInicio = document.getElementById('sec-inicio');
    const secPokemons = document.getElementById('sec-pokemons');
    const secEquipo = document.getElementById('sec-equipo');
    const navInicio = document.getElementById('nav-inicio');
    const navPokemons = document.getElementById('nav-pokemons');
    const navEquipo = document.getElementById('nav-equipo');
    const navItems = document.querySelectorAll('.nav-item');
    const dynamicBg = document.getElementById('dynamic-bg');
    const result = document.getElementById('result');
    const pokemonList = document.getElementById('pokemon-list');
    const teamContainer = document.getElementById('team-table-container');
    const statusBar = document.getElementById('statusBar');
    const statusText = document.getElementById('statusText');
    const timeText = document.getElementById('timeText');
    const methodText = document.getElementById('methodText');
    
    const genFilters = document.getElementById('gen-filters');
    const genBtns = document.querySelectorAll('.gen-btn');
    const searchPanel = document.getElementById('search-panel');

    const API_URL = 'https://pokeapi.co/api/v2/pokemon/';
    let listaNombresPokemon = [];

    const typeColors = {
        normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
        electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
        fighting: '#C22E28', poison: '#A33EA0', ground: '#E2BF65',
        flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
        rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
        dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD'
    };

    let team = JSON.parse(localStorage.getItem('miEquipo')) || [];

    function calcularDistancia(a, b) {
        const matriz = [];
        for (let i = 0; i <= b.length; i++) matriz[i] = [i];
        for (let j = 0; j <= a.length; j++) matriz[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matriz[i][j] = matriz[i - 1][j - 1];
                } else {
                    matriz[i][j] = Math.min(
                        matriz[i - 1][j - 1] + 1,
                        Math.min(matriz[i][j - 1] + 1, matriz[i - 1][j] + 1)
                    );
                }
            }
        }
        return matriz[b.length][a.length];
    }

    async function obtenerNombres() {
        if (listaNombresPokemon.length > 0) return listaNombresPokemon;
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1300');
        const data = await res.json();
        listaNombresPokemon = data.results.map(p => p.name);
        return listaNombresPokemon;
    }

    async function buscarSugerencia(nombreIncorrecto) {
        const nombres = await obtenerNombres();
        let mejorCoincidencia = null;
        let menorDistancia = Infinity;

        nombres.forEach(nombre => {
            const distancia = calcularDistancia(nombreIncorrecto, nombre);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                mejorCoincidencia = nombre;
            }
        });
        if (menorDistancia <= 2) {
            return mejorCoincidencia;
        }
        return null;
    }

    function cambiarSeccion(seccionMostrar, botonActivo) {
        secInicio.classList.add('hidden-section');
        secPokemons.classList.add('hidden-section');
        secEquipo.classList.add('hidden-section');
        seccionMostrar.classList.remove('hidden-section');
        navItems.forEach(btn => btn.classList.remove('active'));
        if (botonActivo) botonActivo.classList.add('active');
    }

    function obtenerUrlFondo(boton) {
        const style = boton.getAttribute('style');
        if (!style) return '';
        const match = style.match(/url\(['"]?(.*?)['"]?\)/);
        return match ? match[1] : '';
    }

    navInicio.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarSeccion(secInicio, navInicio);
        dynamicBg.style.backgroundImage = `url('${obtenerUrlFondo(navInicio)}')`;
        searchPanel.classList.remove('hidden-section'); 
    });

    navPokemons.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarSeccion(secPokemons, navPokemons);
        dynamicBg.style.backgroundImage = `url('${obtenerUrlFondo(navPokemons)}')`;
        searchPanel.classList.add('hidden-section');
        const activeGen = document.querySelector('.gen-btn.active').getAttribute('data-gen');
        cargarGeneracion(activeGen);
    });

    navEquipo.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarSeccion(secEquipo, navEquipo);
        dynamicBg.style.backgroundImage = `url('${obtenerUrlFondo(navEquipo)}')`;
        searchPanel.classList.add('hidden-section');
        renderizarEquipo();
    });

    dynamicBg.style.backgroundImage = `url('${obtenerUrlFondo(navInicio)}')`;
    searchPanel.classList.remove('hidden-section');

    genFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('gen-btn')) {
            genBtns.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const genSeleccionada = e.target.getAttribute('data-gen');
            cargarGeneracion(genSeleccionada);
        }
    });

    async function cargarGeneracion(gen) {
        const generaciones = {
            1: { start: 1, limit: 151 }, 2: { start: 152, limit: 100 },
            3: { start: 252, limit: 135 }, 4: { start: 387, limit: 107 },
            5: { start: 494, limit: 156 }, 6: { start: 650, limit: 72 },
            7: { start: 722, limit: 88 }, 8: { start: 810, limit: 89 },
            9: { start: 906, limit: 120 }
        };

        const rango = generaciones[gen];
        if (!rango) return;

        pokemonList.innerHTML = `<p class="placeholder-small">Cargando Generación ${gen}... ⏳</p>`;
        const promesas = [];
        for (let i = rango.start; i < rango.start + rango.limit; i++) {
            promesas.push(fetch(`${API_URL}${i}`).then(res => res.json()));
        }

        try {
            const resultados = await Promise.all(promesas);
            pokemonList.innerHTML = ''; 
            
            resultados.forEach(data => {
                const id = data.id;
                const imagen = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                const card = document.createElement('div');
                card.className = 'list-card';
                card.innerHTML = `
                    <img src="${imagen}" alt="${data.name}">
                    <p>${data.name}</p>
                    <span class="list-id">#${String(id).padStart(3, '0')}</span>
                `;
                card.addEventListener('click', () => {
                    navInicio.click();
                    searchInput.value = id;
                    buscarAsync(String(id));
                });
                pokemonList.appendChild(card);
            });
        } catch (error) {
            pokemonList.innerHTML = `<p style="color:#ff4d4d;">Error al cargar la lista: ${error.message}</p>`;
        }
    }

    btnAsync.addEventListener('click', () => buscarAsync(searchInput.value.trim()));
    btnThen.addEventListener('click', () => buscarThen(searchInput.value.trim()));
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarAsync(searchInput.value.trim());
    });

    async function buscarAsync(query) {
        if (!query) return mostrarError('Escribe un nombre o número');
        const queryString = String(query).toLowerCase();
        
        mostrarCargando('async/await');
        const inicio = performance.now();

        try {
            const respuesta = await fetch(API_URL + queryString);
            const tiempo = Math.round(performance.now() - inicio);

            if (!respuesta.ok) {
                if (respuesta.status === 404) {
                    mostrarEstado(`❌ ${respuesta.status}`, tiempo, 'async/await');
                    
                    // Intentar corregir el nombre
                    mostrarCargando('Verificando nombre...');
                    const sugerencia = await buscarSugerencia(queryString);
                    
                    if (sugerencia) {
                        alert(`Parece que escribiste mal el nombre. Lo que realmente querias escribir es: "${sugerencia.toUpperCase()}"`);
                        searchInput.value = sugerencia;
                        return buscarAsync(sugerencia);
                    }
                }
                throw new Error(`Pokémon "${query}" no encontrado`);
            }

            const data = await respuesta.json();
            mostrarEstado(`✅ ${respuesta.status} OK`, tiempo, 'async/await');
            renderizarPokemon(data);
        } catch (error) {
            mostrarError(error.message);
        }
    }

    function buscarThen(query) {
        if (!query) return mostrarError('Escribe un nombre o número');
        const queryString = String(query).toLowerCase();

        mostrarCargando('.then()');
        const inicio = performance.now();

        fetch(API_URL + queryString)
            .then(async respuesta => {
                const tiempo = Math.round(performance.now() - inicio);
                if (!respuesta.ok) {
                    if (respuesta.status === 404) {
                        mostrarEstado(`❌ ${respuesta.status}`, tiempo, '.then()');
                        
                        mostrarCargando('Verificando nombre...');
                        const sugerencia = await buscarSugerencia(queryString);
                        
                        if (sugerencia) {
                            alert(`Parece que escribiste mal el nombre. Te sugerimos buscar: "${sugerencia.toUpperCase()}"`);
                            searchInput.value = sugerencia;
                            return buscarThen(sugerencia);
                        }
                    }
                    throw new Error(`Pokémon "${query}" no encontrado`);
                }
                mostrarEstado(`✅ ${respuesta.status} OK`, tiempo, '.then()');
                return respuesta.json();
            })
            .then(data => {
                if (data) renderizarPokemon(data);
            })
            .catch(error => mostrarError(error.message));
    }

    function mostrarCargando(metodo) {
        statusBar.classList.remove('hidden');
        statusText.textContent = '⏳ Cargando...';
        timeText.textContent = '';
        methodText.textContent = `Método: ${metodo}`;
        result.innerHTML = '<p class="placeholder">Buscando en la PokéAPI...</p>';
    }

    function mostrarEstado(estado, tiempo, metodo) {
        statusBar.classList.remove('hidden');
        statusText.textContent = estado;
        timeText.textContent = `⏱️ ${tiempo} ms`;
        methodText.textContent = `Método: ${metodo}`;
    }

    function mostrarError(mensaje) {
        result.innerHTML = `
            <div class="placeholder" style="color:#ff4d4d;">
                <p>⚠️ ${mensaje}</p>
                <p style="font-size: 0.9rem; color: #aaa; margin-top: 10px;">Revisa si escribiste bien el nombre.</p>
            </div>
        `;
    }

    function renderizarPokemon(data) {
        const id = `#${String(data.id).padStart(3, '0')}`;
        const imagen = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
        const tipos = data.types.map(t => {
            const color = typeColors[t.type.name] || '#777';
            return `<span class="type-badge" style="background:${color};">${t.type.name}</span>`;
        }).join('');

        const stats = {};
        data.stats.forEach(s => stats[s.stat.name] = s.base_stat);
        
        const yaEnEquipo = team.some(p => p.id === data.id);

        const juegosUnicos = [...new Set(data.game_indices.map(g => g.version.name))];
        const listaJuegosHTML = juegosUnicos.map(juego => 
            `<li>${juego.replace(/-/g, ' ')}</li>`
        ).join('');

        result.innerHTML = `
            <div class="pokemon-card">
                <img src="${imagen}" alt="${data.name}">
                <div class="pokemon-info">
                    <h2>${data.name}</h2>
                    <span class="pokemon-id">${id}</span>
                    <div class="types">${tipos}</div>
                    
                    <div class="pokemon-details">
                        <div class="detail-item"><span class="detail-label">Altura</span><span class="detail-value">${(data.height / 10).toFixed(1)} m</span></div>
                        <div class="detail-item"><span class="detail-label">Peso</span><span class="detail-value">${(data.weight / 10).toFixed(1)} kg</span></div>
                        <div class="detail-item"><span class="detail-label">HP</span><span class="detail-value">${stats.hp}</span></div>
                        <div class="detail-item"><span class="detail-label">Ataque</span><span class="detail-value">${stats.attack}</span></div>
                        <div class="detail-item"><span class="detail-label">Defensa</span><span class="detail-value">${stats.defense}</span></div>
                        <div class="detail-item"><span class="detail-label">Velocidad</span><span class="detail-value">${stats.speed}</span></div>
                    </div>

                    <details class="games-accordion">
                        <summary>🎮 ¿En qué juegos aparece? (${juegosUnicos.length})</summary>
                        <ul class="games-list">${listaJuegosHTML}</ul>
                    </details>
                    
                    <button class="btn-save" id="btnSave" ${yaEnEquipo ? 'disabled' : ''}>
                        ${yaEnEquipo ? '✅ Ya en tu equipo' : '⭐ Guardar en mi equipo'}
                    </button>
                </div>
            </div>
        `;

        if (!yaEnEquipo) {
            document.getElementById('btnSave').addEventListener('click', () => guardarEnEquipo(data));
        }
    }

    function guardarEnEquipo(dataCompleta) {
        if (team.length >= 6) {
            alert('Tu equipo ya tiene 6 Pokémon.');
            return;
        }

        const yaExiste = team.some(p => p.id === dataCompleta.id);
        if (yaExiste) {
            alert('¡Ya tienes a este Pokémon en tu equipo!');
            return;
        }

        const nuevoPokemon = {
            id: dataCompleta.id, name: dataCompleta.name, image: dataCompleta.sprites.front_default,
            types: dataCompleta.types.map(t => t.type.name).join(', '),
            abilities: dataCompleta.abilities.map(a => a.ability.name).join(', '),
            height: (dataCompleta.height / 10).toFixed(1), weight: (dataCompleta.weight / 10).toFixed(1),
            hp: dataCompleta.stats.find(s => s.stat.name === 'hp').base_stat,
            attack: dataCompleta.stats.find(s => s.stat.name === 'attack').base_stat,
            defense: dataCompleta.stats.find(s => s.stat.name === 'defense').base_stat,
            spAtk: dataCompleta.stats.find(s => s.stat.name === 'special-attack').base_stat,
            spDef: dataCompleta.stats.find(s => s.stat.name === 'special-defense').base_stat,
            speed: dataCompleta.stats.find(s => s.stat.name === 'speed').base_stat
        };

        team.push(nuevoPokemon);
        localStorage.setItem('miEquipo', JSON.stringify(team));
        renderizarPokemon(dataCompleta); 
        renderizarEquipo();
    }

    function eliminarDelEquipo(id) {
        team = team.filter(p => p.id !== id);
        localStorage.setItem('miEquipo', JSON.stringify(team));
        renderizarEquipo();
    }

    function renderizarEquipo() {
        if (team.length === 0) {
            teamContainer.innerHTML = '<p class="placeholder-small">Aún no has guardado Pokémon en tu equipo</p>';
            return;
        }

        let tablaHTML = `
            <div class="table-responsive">
                <table class="team-table">
                    <thead>
                        <tr>
                            <th>Img</th><th>Nombre</th><th>Tipos</th><th>Habilidades</th><th>Alt/Peso</th>
                            <th>HP</th><th>Ataque</th><th>Defensa</th><th>Atq. Esp</th><th>Def. Esp</th><th>Vel.</th><th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        team.forEach(p => {
            const habs = p.abilities ? p.abilities.split(', ').join('<br>') : '-';
            const tiposFormateados = p.types ? p.types.replace(/, /g, ', ') : '-';
            tablaHTML += `
                <tr>
                    <td><img src="${p.image}" alt="${p.name}"></td>
                    <td style="text-transform:capitalize; font-weight:bold; color:#c5a059;">${p.name}</td>
                    <td style="font-size: 0.85rem; text-transform:capitalize;">${tiposFormateados}</td>
                    <td style="font-size: 0.75rem; text-transform:capitalize; color:#aaa;">${habs}</td>
                    <td style="font-size: 0.85rem;">${p.height || '?'} m<br>${p.weight || '?'} kg</td>
                    <td style="color: #ff6b6b; font-weight:bold;">${p.hp}</td>
                    <td style="color: #ff9f43; font-weight:bold;">${p.attack}</td>
                    <td style="color: #54a0ff; font-weight:bold;">${p.defense}</td>
                    <td style="color: #ff9f43; font-weight:bold;">${p.spAtk || '-'}</td>
                    <td style="color: #54a0ff; font-weight:bold;">${p.spDef || '-'}</td>
                    <td style="color: #a29bfe; font-weight:bold;">${p.speed || '-'}</td>
                    <td><button class="btn-remove" onclick="eliminarDelEquipo(${p.id})">Eliminar</button></td>
                </tr>
            `;
        });

        tablaHTML += `</tbody></table></div>`;
        teamContainer.innerHTML = tablaHTML;
    }

    window.eliminarDelEquipo = eliminarDelEquipo;
    renderizarEquipo();
});