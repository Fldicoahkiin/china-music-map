import * as d3 from 'd3';
import { gsap } from 'gsap';

/**
 * 初始化D3.js驱动的地图场景
 * @param {HTMLElement} container - 容纳SVG的DOM元素
 * @param {Function} onBandSelect - 乐队被选中时的回调函数
 * @param {Function} onProgress - 数据加载进度回调
 * @param {Function} onLoaded - 数据加载完成回调
 */
export function initD3Scene(container, onBandSelect, onProgress, onLoaded) {
    const { clientWidth, clientHeight } = container;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', [0, 0, clientWidth, clientHeight]);

    // 添加阴影滤镜，用于省份高亮
    svg.append('defs').html(`<filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="2" result="offsetblur"/><feMerge><feMergeNode in="offsetblur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    
    const g = svg.append('g');
    const provinceGroup = g.append('g').attr('class', 'provinces');
    const bandGroup = g.append('g').attr('class', 'bands');
    const nameGroup = g.append('g').attr('class', 'names');

    // 地图投影
    const projection = d3.geoMercator()
        .center([104.0, 37.5])
        .scale(clientWidth * 0.9)
        .translate([clientWidth / 2, clientHeight / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // 缩放行为
    const zoom = d3.zoom()
        .scaleExtent([1, 25]) // 增加最大缩放级别
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            updateAdaptiveElements(event.transform);
        });

    svg.call(zoom).on("dblclick.zoom", null);

    let activeProvince = null; // 当前激活的省份元素
    let lastTransform = d3.zoomIdentity; // 存储上一次的缩放状态
    let chinaFeatures = []; // 存储中国地理特征数据
    let bandDataByProvince = new Map(); // 按省份名称组织的乐队数据

    // 异步加载和处理所有数据
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

            // 按省份组织乐队数据，处理名称后缀
            bandDataByProvince = d3.group(allBands, d => {
                return d.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            });

            chinaFeatures = chinaGeoJson.features;
            
            // 预计算省份的地理属性，如边界、中心点和尺寸
            chinaFeatures.forEach(f => {
                f.properties.bounds = pathGenerator.bounds(f);
                f.properties.centroid = pathGenerator.centroid(f);
                const [x0, y0] = f.properties.bounds[0];
                const [x1, y1] = f.properties.bounds[1];
                f.properties.width = x1 - x0;
                f.properties.height = y1 - y0;
            });

            // 绘制省份路径
            provinceGroup.selectAll('path')
                .data(chinaFeatures, d => d.properties.name) // 使用key函数优化更新
                .enter().append('path')
                .attr('d', pathGenerator)
                .attr('class', 'province')
                .attr('fill', 'none')
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .on('click', handleProvinceClick)
                .on('mouseover', function() { if(this !== activeProvince) d3.select(this).attr('fill', '#f0f0f0'); })
                .on('mouseout', function() { if(this !== activeProvince) d3.select(this).attr('fill', 'none'); });

            // 绘制省份名称
            nameGroup.selectAll('.province-name')
                .data(chinaFeatures, d => d.properties.name)
                .enter().append('text')
                .attr('class', 'province-name')
                .attr('transform', d => `translate(${d.properties.centroid})`)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .text(d => d.properties.name || d.properties.fullname)
                .style('font-size', '1px') // 初始字体极小，通过updateAdaptiveElements更新
                .style('opacity', 0)       // 初始透明
                .attr('fill', 'rgba(0,0,0,0.5)')
                .style('pointer-events', 'none');

            // 初始化乐队元素的布局
            setupBandLayouts();
            
            // 初始化视图，确保地图完整显示
            updateAdaptiveElements(d3.zoomIdentity);
            onProgress(100);
            setTimeout(onLoaded, 300);

        } catch (error) {
            console.error("数据加载或处理失败:", error);
        }
    }

    // 为每个省份的乐队设置初始布局
    function setupBandLayouts() {
        bandDataByProvince.forEach((bands, provinceName) => {
            const feature = chinaFeatures.find(f => (f.properties.name || f.properties.fullname) === provinceName);
            if (!feature) return;

            const [ [x0, y0], [x1, y1] ] = feature.properties.bounds;
            const forceNodes = bands.map(d => ({ ...d }));

            const isCrowded = ['北京', '天津', '上海', '香港', '澳门'].includes(provinceName);
            
            // 使用力导向布局来防止乐队图标重叠
            const simulation = d3.forceSimulation(forceNodes)
                .force('collide', d3.forceCollide().radius(isCrowded ? 25 : 15)) // 为拥挤区域提供更大间距
                .force('x', d3.forceX(feature.properties.centroid[0]).strength(0.1))
                .force('y', d3.forceY(feature.properties.centroid[1]).strength(0.1))
                .stop();

            simulation.tick(300); // 同步运行模拟以稳定布局

            // 对非拥挤区域，强制将乐队节点约束在省份边界内
            if (!isCrowded) {
                forceNodes.forEach(node => {
                    const r = 12; // 节点半径
                    node.x = Math.max(x0 + r, Math.min(x1 - r, node.x));
                    node.y = Math.max(y0 + r, Math.min(y1 - r, node.y));
                });
            }

            const bandContainer = bandGroup.append('g')
                .attr('class', `band-container band-container-${provinceName}`);

            const bandSelection = bandContainer.selectAll('.band-group')
                .data(forceNodes, d => d.id) // 使用key函数
                .enter().append('g')
                .attr('class', 'band-group')
                .style('cursor', 'pointer')
                .attr('transform', d => `translate(${d.x},${d.y})`) // 应用力导向布局结果
                .on('mouseover', function() {
                    d3.select(this).raise().transition().duration(200).attr('transform', d => `translate(${d.x},${d.y}) scale(1.2)`);
                })
                .on('mouseout', function() {
                    d3.select(this).transition().duration(200).attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
                })
                .on('click', (event, d) => {
                    onBandSelect(d);
                    event.stopPropagation(); // 阻止事件冒泡到省份
                });
            
            // 引线：连接乐队和省份中心，采用 "垂直+倾斜" 的路径
            bandSelection.append('path')
                .attr('class', 'leader-line')
                .attr('d', d => {
                    const [cx, cy] = feature.properties.centroid;
                    const elbowY = d.y + (cy > d.y ? 20 : -20); // 计算肘部y坐标
                    return `M0,0 L0,${elbowY - d.y} L${cx - d.x},${cy - d.y}`;
                })
                .attr('stroke', '#555')
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .style('opacity', 0); // 初始不可见
            
            // 乐队图标或名称
            bandSelection.each(function(d) {
                const group = d3.select(this);
                if (d.logo && d.logo.trim() !== '') {
                    group.append('image')
                        .attr('href', `data/${d.genre}/logos/${d.logo}`)
                        .attr('x', -12).attr('y', -12)
                        .attr('width', 24).attr('height', 24)
                        .attr('class', 'band-logo')
                        .on('error', function() { // logo加载失败则显示文字
                            d3.select(this).remove();
                            group.append('text').text(d.name).attr('class', 'band-name').attr('font-size', '10px').attr('text-anchor', 'middle');
                        });
                } else {
                    group.append('text').text(d.name).attr('class', 'band-name').attr('font-size', '10px').attr('text-anchor', 'middle');
                }
            });
        });
    }

    // 根据缩放级别更新所有自适应元素
    function updateAdaptiveElements(transform) {
        const k = transform.k;
        
        // 更新省份名称：根据缩放调整显隐和字体大小
        nameGroup.selectAll('.province-name')
            .style('opacity', d => (d.properties.width * k > 20 && d.properties.height * k > 20) ? 1 : 0)
            .style('font-size', d => {
                const size = Math.min(d.properties.width, d.properties.height) * k / (d.properties.name.length * 0.8 + 1);
                return `${Math.max(0, Math.min(size, 20))}px`; // 限制最大字体，避免过大
            });

        // 更新乐队元素：调整大小和引线可见性
        const bandScale = Math.max(0.6, Math.min(1.2, k / 2.5)); // 增大初始大小，优化缩放曲线
        const leaderLineOpacity = Math.max(0, Math.min(1, (k - 2) / 3)); // 优化引线出现时机

        bandGroup.selectAll('.band-group').attr('transform', function(d) {
            // 应用位移和缩放
            return `translate(${d.x},${d.y}) scale(${bandScale})`;
        });
        
        bandGroup.selectAll('.leader-line').style('opacity', leaderLineOpacity);

        // 更新省份描边宽度，使其在缩放时保持视觉一致
        provinceGroup.selectAll('.province')
            .attr('stroke-width', 1 / k);
    }

    // 处理省份点击事件
    function handleProvinceClick(event, d, elementNode) {
        // elementNode参数用于从乐队点击事件中传入省份元素
        const element = elementNode || this;
        if (!d) return;

        // 检查点击事件是否发生在乐队元素上，如果是则忽略
        if (event.target.closest('.band-group')) {
            return;
        }

        const wasActive = activeProvince === element;

        // 如果之前有高亮的省份，则恢复其样式
        if (activeProvince && activeProvince !== element) {
            d3.select(activeProvince).attr('fill', 'none').style('filter', null);
        }
        
        // 如果点击的是已高亮的省份，则恢复到上一个视图状态
        if (wasActive) {
            svg.transition().duration(750).call(zoom.transform, lastTransform);
            d3.select(activeProvince).attr('fill', 'none').style('filter', null);
            activeProvince = null;
            return;
        }
        
        // 存储点击前一刻的缩放状态
        lastTransform = d3.zoomTransform(svg.node());

        activeProvince = element;
        const provinceSelection = d3.select(activeProvince);
        // 将点击的省份及其相关元素（名称、乐队）提升到顶层，避免被遮挡
        provinceSelection.raise(); 
        const provinceName = d.properties.name || d.properties.fullname;
        nameGroup.selectAll('.province-name').filter(p => p === d).raise();
        bandGroup.selectAll(`.band-container-${provinceName}`).raise();

        provinceSelection.attr('fill', '#f0f0f0').style('filter', 'url(#drop-shadow)');
        
        // 计算缩放参数以聚焦到该省份
        const [[x0, y0], [x1, y1]] = pathGenerator.bounds(d);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        const scale = Math.max(1, Math.min(15, 0.9 / Math.max(dx / clientWidth, dy / clientHeight)));
        const translate = [clientWidth / 2 - scale * x, clientHeight / 2 - scale * y];

        const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);
        
        // 平滑过渡到新视图
        svg.transition().duration(750)
            .call(zoom.transform, transform);
    }
    
    // 重置视图到初始状态
    function resetView() {
        if (activeProvince) {
            d3.select(activeProvince).attr('fill', 'none').style('filter', null);
            activeProvince = null;
        }
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        lastTransform = d3.zoomIdentity; // 完全重置也应重置lastTransform
    }

    // 开始加载数据
    loadData();
    
    // 返回可供外部调用的方法
    return { resetView };
} 