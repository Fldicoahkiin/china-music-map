import * as d3 from 'd3';
import { gsap } from 'gsap';

export function initD3Scene(container, onBandSelect, onProgress, onLoaded) {
    const { clientWidth, clientHeight } = container;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', [0, 0, clientWidth, clientHeight]);

    svg.append('defs').html(`<filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="2" result="offsetblur"/><feMerge><feMergeNode in="offsetblur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    
    const g = svg.append('g');
    const provinceGroup = g.append('g').attr('class', 'provinces');
    const bandGroup = g.append('g').attr('class', 'bands');
    const nameGroup = g.append('g').attr('class', 'names');


    const projection = d3.geoMercator()
        .center([104.0, 37.5])
        .scale(clientWidth * 0.9)
        .translate([clientWidth / 2, clientHeight / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const zoom = d3.zoom()
        .scaleExtent([1, 15])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            updateAdaptiveElements(event.transform);
        });

    svg.call(zoom).on("dblclick.zoom", null);

    let activeProvince = null;
    let activeProvinceData = null;
    let bandDataByProvince = null;

    async function loadData() {
        try {
            onProgress(0);
            const genresData = await d3.json('/data/genres.json');
            onProgress(10);

            const bandPromises = genresData.genres.map(genreId => 
                d3.json(`/data/${genreId}/bands.json`).then(bands => 
                    bands.map(band => ({ ...band, genre: genreId }))
                )
            );
            
            const [chinaGeoJson, ...bandsByGenre] = await Promise.all([
                d3.json('/china.json'),
                ...bandPromises
            ]);
            onProgress(60);

            const allBands = bandsByGenre.flat();

            bandDataByProvince = d3.group(allBands, d => {
                return d.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            });

            const { features } = chinaGeoJson;
            
            provinceGroup.selectAll('path')
                .data(features)
                .enter().append('path')
                .attr('d', pathGenerator)
                .attr('class', 'province')
                .attr('fill', 'none')
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .on('click', (event, d) => handleProvinceClick(d, event.currentTarget))
                .on('mouseover', function() { d3.select(this).attr('fill', '#f0f0f0'); })
                .on('mouseout', function() { if(this !== activeProvince) d3.select(this).attr('fill', 'none'); });

            nameGroup.selectAll('.province-name')
                .data(features)
                .enter().append('text')
                .attr('class', 'province-name')
                .attr('transform', d => `translate(${pathGenerator.centroid(d)})`)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .text(d => d.properties.name || d.properties.fullname)
                .attr('font-size', '12px')
                .attr('fill', 'rgba(0,0,0,0.5)')
                .style('pointer-events', 'none');

            bandDataByProvince.forEach((bands, provinceName) => {
                const feature = features.find(f => (f.properties.name || f.properties.fullname) === provinceName);
                if (!feature) return;

                const centroid = pathGenerator.centroid(feature);
                
                const bandContainer = bandGroup.append('g')
                    .attr('class', `band-container band-container-${provinceName}`);

                const positionedBands = bands.map(band => ({ ...band, x: centroid[0], y: centroid[1]}));

                const bandSelection = bandContainer.selectAll('.band-group')
                    .data(positionedBands)
                    .enter().append('g')
                    .attr('class', 'band-group')
                    .attr('transform', d => `translate(${d.x},${d.y})`)
                    .style('cursor', 'pointer')
                    .on('click', (event, d) => {
                        onBandSelect(d);
                        handleProvinceClick(feature, provinceGroup.selectAll('path').filter(f => f === feature).node());
                        event.stopPropagation();
                    });

                bandSelection.append('line')
                    .attr('class', 'leader-line')
                    .attr('x1', 0).attr('y1', 0)
                    .attr('x2', 0).attr('y2', 10)
                    .attr('stroke', '#555')
                    .attr('stroke-width', 1)
                    .style('display', 'none');
                
                bandSelection.each(function(d) {
                    const group = d3.select(this);
                    if (d.logo && d.logo.trim() !== '') {
                        group.append('image')
                            .attr('href', `data/${d.genre}/logos/${d.logo}`)
                            .attr('x', -12).attr('y', -12)
                            .attr('width', 24).attr('height', 24)
                            .on('error', function() {
                                d3.select(this).remove();
                                group.append('text').text(d.name).attr('font-size', '10px').attr('text-anchor', 'middle');
                            });
                    } else {
                        group.append('text').text(d.name).attr('font-size', '10px').attr('text-anchor', 'middle');
                    }
                });
            });
            
            updateAdaptiveElements(d3.zoomIdentity);
            onProgress(100);
            setTimeout(onLoaded, 300);

        } catch (error) {
            console.error("Failed to load or process map data:", error);
        }
    }

    function updateAdaptiveElements(transform) {
        const k = transform.k;
        
        nameGroup.selectAll('.province-name').style('display', k > 1.2 ? 'block' : 'none');
        bandGroup.selectAll('.band-group').style('display', k > 1.1 ? 'block' : 'none');
        
        if (activeProvinceData) {
            const provinceName = activeProvinceData.properties.name || activeProvinceData.properties.fullname;
            const bands = bandDataByProvince.get(provinceName);
            if (!bands) return;

            const spacing = 30;
            const centroid = pathGenerator.centroid(activeProvinceData);

            if (k > 2.5) { // Unfurl logic
                const numBands = bands.length;
                const startY = centroid[1] - ((numBands - 1) * spacing) / 2;
                
                d3.selectAll(`.band-container-${provinceName} .band-group`).each(function(d, i) {
                    gsap.to(this, {
                        duration: 0.5,
                        attr: { transform: `translate(${centroid[0]}, ${startY + i * spacing})` },
                        ease: 'power2.out'
                    });
                    gsap.to(d3.select(this).select('.leader-line').node(), {
                        duration: 0.5,
                        attr: { y2: 0, x2: 0 },
                        ease: 'power2.out'
                    });
                });
            } else { // Stack logic
                d3.selectAll(`.band-container-${provinceName} .band-group`).each(function(d, i) {
                     gsap.to(this, {
                        duration: 0.5,
                        attr: { transform: `translate(${centroid[0]}, ${centroid[1]})` },
                        ease: 'power2.out'
                    });
                });
            }
        }
    }

    function handleProvinceClick(d, element) {
        if (!element) return;
        
        const wasActive = activeProvince === element;

        if (activeProvince) {
            gsap.to(activeProvince, { duration: 0.2, attr: { transform: 'translate(0,0)' }, ease: 'power2.in' });
            d3.select(activeProvince).style('filter', null).attr('fill', 'none');
            // Reset old province bands to stack
            const oldProvinceName = activeProvinceData.properties.name || activeProvinceData.properties.fullname;
            d3.selectAll(`.band-container-${oldProvinceName} .band-group`).each(function() {
                 gsap.to(this, { duration: 0.5, attr: { transform: `translate(${pathGenerator.centroid(activeProvinceData)})` }, ease: 'power2.out' });
            });
        }
        
        if (wasActive) {
            activeProvince = null;
            activeProvinceData = null;
            resetView();
            return;
        }
        
        activeProvince = element;
        activeProvinceData = d;
        const provinceSelection = d3.select(activeProvince);
        provinceSelection.raise();

        gsap.to(element, { duration: 0.2, attr: { transform: 'translate(-2,-5)' }, ease: 'power2.out' });
        provinceSelection.style('filter', 'url(#drop-shadow)').attr('fill', '#f0f0f0');
        
        const [[x0, y0], [x1, y1]] = pathGenerator.bounds(d);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        const scale = Math.max(1.5, Math.min(8, 0.9 / Math.max(dx / clientWidth, dy / clientHeight)));
        const translate = [clientWidth / 2 - scale * x, clientHeight / 2 - scale * y];

        const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);
        
        svg.transition().duration(750)
            .call(zoom.transform, transform)
            .on('end', () => updateAdaptiveElements(transform)); // ensure layout updates after zoom
    }
    
    function resetView() {
        if (activeProvince) {
            gsap.to(activeProvince, { duration: 0.2, attr: { transform: 'translate(0,0)' }, ease: 'power2.in' });
            d3.select(activeProvince).style('filter', null).attr('fill', 'none');
             const provinceName = activeProvinceData.properties.name || activeProvinceData.properties.fullname;
            d3.selectAll(`.band-container-${provinceName} .band-group`).each(function() {
                 gsap.to(this, { duration: 0.5, attr: { transform: `translate(${pathGenerator.centroid(activeProvinceData)})` }, ease: 'power2.out' });
            });
            activeProvince = null;
            activeProvinceData = null;
        }
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }

    loadData();
    
    return { resetView };
} 