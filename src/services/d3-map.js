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
    let clientWidth, clientHeight;

    function updateDimensions() {
        clientWidth = container.clientWidth;
        clientHeight = container.clientHeight;
    }
    updateDimensions();

    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%') // 设置为100%以实现响应式
        .attr('height', '100%')// 设置为100%以实现响应式
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

    // 在SVG上添加一个背景矩形，用于捕获空白区域的点击
    svg.insert('rect', ':first-child')
        .attr('class', 'background')
        .attr('width', clientWidth)
        .attr('height', clientHeight)
        .attr('fill', 'none')
        .style('pointer-events', 'all')
        .on('click', resetView);

    let activeProvince = null; // 当前激活的省份元素
    let activeProvinceFeature = null; // 当前激活的省份数据
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
                
                // 优先使用geojson中提供的中心点，回退到算法计算
                let centroid;
                if (f.properties.center) {
                    centroid = projection(f.properties.center);
                } else {
                    centroid = pathGenerator.centroid(f);
                }

                // 增加质心有效性检查，防止NaN错误
                if (isNaN(centroid[0]) || isNaN(centroid[1])) {
                    console.warn(`[Map] Invalid centroid for province: ${f.properties.name || f.properties.fullname}. Skipping.`);
                    f.properties.centroid = null; // 标记为无效
                } else {
                    f.properties.centroid = centroid;
                }

                const [[x0, y0], [x1, y1]] = f.properties.bounds;
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
                .on('mouseover', function(event, d) { 
                    if(activeProvinceFeature !== d) d3.select(this).attr('fill', '#f0f0f0'); 
                })
                .on('mouseout', function(event, d) { 
                    if(activeProvinceFeature !== d) d3.select(this).attr('fill', 'none'); 
                });

            // 绘制省份名称
            nameGroup.selectAll('.province-name')
                .data(chinaFeatures.filter(d => d.properties.centroid), d => d.properties.name) // 过滤掉无效质心的省份
                .enter().append('text')
                .attr('class', 'province-name')
                .attr('transform', d => `translate(${d.properties.centroid})`)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .text(d => d.properties.name || d.properties.fullname)
                .style('font-size', '1px') // 初始字体极小，通过updateAdaptiveElements更新
                .style('opacity', 0)       // 初始透明
                .attr('fill', 'rgba(0,0,0,0.5)')
                .style('font-family', 'Songti SC, STSong, NSimSun, serif') // 设置字体
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
            if (!feature || !feature.properties.centroid) return; // 跳过没有有效质心的省份

            const [ [x0, y0], [x1, y1] ] = feature.properties.bounds;
            
            const isCrowded = ['北京', '天津', '上海', '香港', '澳门'].includes(provinceName);

            // 为每个乐队节点计算初始尺寸，用于碰撞检测
            const forceNodes = bands.map(d => {
                const node = { ...d, isCrowded }; // 将拥挤信息附加到节点上
                if (d.logo) {
                    node.radius = 14; // logo的碰撞半径
                } else {
                    // 根据名字长度估算碰撞半径
                    node.radius = Math.max(10, d.name.length * 3);
                }
                return node;
            });

            // 使用力导向布局来防止乐队图标重叠
            const simulation = d3.forceSimulation(forceNodes)
                .force('collide', d3.forceCollide().radius(d => d.radius + 2).iterations(2)) // 根据节点半径进行碰撞检测
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
                .attr('class', `band-container band-container-${provinceName}`)
                .style('pointer-events', 'none'); // 容器不响应事件，允许穿透

            const bandSelection = bandContainer.selectAll('.band-group')
                .data(forceNodes, d => d.id) // 使用key函数
                .enter().append('g')
                .attr('class', 'band-group')
                .style('cursor', 'pointer')
                .style('pointer-events', 'all') // 但单个乐队依然响应
                .attr('transform', d => `translate(${d.x},${d.y})`) // 应用力导向布局结果
                .on('mouseover', function() {
                    const group = d3.select(this).raise();
                    group.select('.band-logo').transition().duration(200).attr('transform', 'scale(1.2)');
                    group.select('.band-name').transition().duration(200).attr('transform', 'scale(1.2)');
                })
                .on('mouseout', function() {
                    const group = d3.select(this);
                    group.select('.band-logo, .band-name').transition().duration(200).attr('transform', 'scale(1)');
                })
                .on('click', (event, d) => {
                    onBandSelect(d);
                    const provinceName = d.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
                    const feature = chinaFeatures.find(f => (f.properties.name || f.properties.fullname) === provinceName);
                    if (feature) {
                        zoomToProvince(feature);
                    }
                    event.stopPropagation(); // 阻止事件冒泡到省份
                });
            
            // 引线：连接乐队和省份中心
            bandSelection.append('path')
                .attr('class', 'leader-line')
                .attr('d', d => {
                    const [cx, cy] = feature.properties.centroid;
                    // 重新设计引线路径，使其更简约
                    const elbowY = d.y + (cy > d.y ? 10 : -10);
                    return `M0,0 L0,${elbowY - d.y} L${cx - d.x},${cy - d.y}`;
                })
                .attr('stroke', '#888') // 变细、变灰
                .attr('stroke-width', 0.5) // 显著变细
                .attr('stroke-dasharray', '2,2') // 添加虚线效果
                .attr('fill', 'none')
                .style('pointer-events', 'none') // 禁止引线响应鼠标事件
                .style('opacity', 0); // 初始不可见
            
            // 乐队图标或名称，并添加背景框
            bandSelection.each(function(d) {
                const group = d3.select(this);
                let element;

                if (d.logo && d.logo.trim() !== '') {
                    element = group.append('image')
                        .attr('href', `data/${d.genre}/logos/${d.logo}`)
                        .attr('x', -12).attr('y', -12)
                        .attr('width', 24).attr('height', 24)
                        .attr('class', 'band-logo');
                    
                    element.on('error', () => { // logo加载失败则显示文字
                        element.remove();
                        const text = group.append('text').text(d.name).attr('class', 'band-name').attr('font-size', '10px').attr('text-anchor', 'middle');
                        addBox(text);
                    });
                } else {
                    element = group.append('text').text(d.name).attr('class', 'band-name').attr('font-size', '10px').attr('text-anchor', 'middle');
                }
                
                // 添加背景框的辅助函数
                function addBox(el) {
                    const bbox = el.node().getBBox();
                    const padding = { x: 4, y: 2 };
                    group.insert('rect', ':first-child')
                        .attr('class', 'band-box')
                        .attr('x', bbox.x - padding.x)
                        .attr('y', bbox.y - padding.y)
                        .attr('width', bbox.width + 2 * padding.x)
                        .attr('height', bbox.height + 2 * padding.y)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('fill', 'rgba(255,255,255,0.75)')
                        .attr('stroke', '#aaa')
                        .attr('stroke-width', 0.5);
                }
                
                // 确保元素已渲染后再获取bbox
                setTimeout(() => addBox(element), 0);
            });
        });
    }

    // 根据缩放级别更新所有自适应元素
    function updateAdaptiveElements(transform) {
        const k = transform.k;
        
        // --- 更新省份名称 ---
        // 核心逻辑: 基于省份的实际边界框和文本的渲染大小，智能决定显隐
        nameGroup.selectAll('.province-name')
            .style('font-size', d => {
                // 字体大小基于省份面积的平方根，使其与视觉大小更相关
                const baseSize = Math.sqrt(d.properties.width * d.properties.height) / (d.properties.name.length + 3);
                // 使用Math.sqrt(k)进行非常平缓的缩放，并把大小限制在[10px, 24px]的区间内
                const scaledSize = baseSize * Math.sqrt(k) * 0.8;
                return `${Math.max(10, Math.min(scaledSize, 24))}px`;
            })
            .style('opacity', function(d) {
                // 1. 初步启发式检查：省份在屏幕上是否足够大
                const nameLength = (d.properties.name || d.properties.fullname).length;
                const scaledWidth = d.properties.width * k;
                const scaledHeight = d.properties.height * k;
                if (!(scaledWidth > nameLength * 15 && scaledHeight > 15)) {
                    return 0;
                }

                // 2. 精确的边界检查：文本渲染后是否会超出省份边界框
                try {
                    const textBBox = this.getBBox();
                    const [[x0, y0], [x1, y1]] = d.properties.bounds;
                    const [cx, cy] = d.properties.centroid;

                    // 检查文本的实际边界是否会超出省份的地理边界
                    if (
                        cx - textBBox.width / 2 < x0 ||
                        cx + textBBox.width / 2 > x1 ||
                        cy - textBBox.height / 2 < y0 ||
                        cy + textBBox.height / 2 > y1
                    ) {
                        return 0; // 如果溢出，则隐藏
                    }
                } catch (e) {
                    // getBBox 在某些情况下可能失败 (如元素不可见), 安全起见直接隐藏
                    return 0;
                }

                return 1; // 通过所有检查，显示
            });

        // --- 更新乐队元素 ---
        // 核心逻辑: 根据省份拥挤程度，采用不同的缩放策略
        bandGroup.selectAll('.band-group').attr('transform', function(d) {
            let bandScale;
            if (d.isCrowded) {
                // 对于拥挤区域, 放大时缩小标识, 以腾出空间显示更多细节
                // 在屏幕上的绝对大小会随着放大而减小
                bandScale = Math.max(0.4, 1 / Math.sqrt(k));
            } else {
                // 对于稀疏区域, 放大时让标识也适度变大, 突出视觉
                bandScale = Math.min(1.7, 1 + (k - 1) * 0.1);
            }
            return `translate(${d.x},${d.y}) scale(${bandScale})`;
        });
        
        const leaderLineOpacity = Math.max(0, Math.min(0.7, (k - 1.5) / 3));
        bandGroup.selectAll('.leader-line').style('opacity', leaderLineOpacity);

        // 更新省份描边宽度，使其在缩放时保持视觉一致
        provinceGroup.selectAll('.province')
            .attr('stroke-width', 1 / k);
    }

    // 处理省份点击事件
    function handleProvinceClick(event, d) {
        // 阻止事件冒泡到SVG背景，防止立即重置视图
        event.stopPropagation();

        // 如果点击的已经是激活的省份，则重置视图（恢复toggle模式）
        if (activeProvinceFeature === d) {
            resetView();
            return;
        }

        zoomToProvince(d);
    }

    // 缩放到指定省份
    function zoomToProvince(d) {
        const alreadyActive = activeProvinceFeature === d;
        if (alreadyActive) return; // 如果已经是激活省份，则不执行任何操作

        const provincePath = provinceGroup.selectAll('path').filter(p => p === d).node();
        if (!provincePath) return;

        // 如果之前有高亮的省份，则恢复其样式
        if (activeProvince) {
            d3.select(activeProvince).attr('fill', 'none').style('filter', null);
        }

        // 存储点击前一刻的缩放状态
        lastTransform = d3.zoomTransform(svg.node());

        activeProvince = provincePath;
        activeProvinceFeature = d;
        const provinceSelection = d3.select(activeProvince);
        
        provinceSelection.raise();
        const provinceName = d.properties.name || d.properties.fullname;
        nameGroup.selectAll('.province-name').filter(p => p === d).raise();
        bandGroup.selectAll(`.band-container-${provinceName}`).raise();

        provinceSelection.attr('fill', '#f0f0f0').style('filter', 'url(#drop-shadow)');

        const [[x0, y0], [x1, y1]] = pathGenerator.bounds(d);
        // 增加边界有效性检查
        if (![x0, y0, x1, y1].every(isFinite)) {
            console.error(`[Map] Invalid bounds for province: ${d.properties.name}. Cannot zoom.`);
            return;
        }

        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        const scale = Math.max(1, Math.min(15, 0.9 / Math.max(dx / clientWidth, dy / clientHeight)));
        const translate = [clientWidth / 2 - scale * x, clientHeight / 2 - scale * y];

        const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

        svg.transition().duration(750)
            .call(zoom.transform, transform);
    }
    
    // 重置视图到初始状态
    function resetView() {
        if (activeProvince) {
            d3.select(activeProvince).attr('fill', 'none').style('filter', null);
            activeProvince = null;
            activeProvinceFeature = null;
        }
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        lastTransform = d3.zoomIdentity; // 完全重置也应重置lastTransform
    }

    // --- 响应式布局和工具函数 ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function resize() {
        updateDimensions();
        svg.attr('viewBox', [0, 0, clientWidth, clientHeight]);
        svg.select('.background').attr('width', clientWidth).attr('height', clientHeight);

        // 更新投影
        projection
            .scale(clientWidth * 0.9)
            .translate([clientWidth / 2, clientHeight / 2]);

        // 重新计算所有地理相关属性
        chinaFeatures.forEach(f => {
            f.properties.bounds = pathGenerator.bounds(f);
            
            // 优先使用geojson中提供的中心点，回退到算法计算
            let centroid;
            if (f.properties.center) {
                centroid = projection(f.properties.center);
            } else {
                centroid = pathGenerator.centroid(f);
            }

            if (isNaN(centroid[0]) || isNaN(centroid[1])) {
                f.properties.centroid = null;
            } else {
                f.properties.centroid = centroid;
            }

            const [[x0, y0], [x1, y1]] = f.properties.bounds;
            f.properties.width = x1 - x0;
            f.properties.height = y1 - y0;
        });

        // 重绘省份
        provinceGroup.selectAll('path').attr('d', pathGenerator);

        // 更新省份名称位置
        nameGroup.selectAll('.province-name')
            .attr('transform', d => `translate(${d.properties.centroid})`);
        
        // 销毁并重建乐队布局，因为位置全变了
        bandGroup.selectAll('*').remove();
        setupBandLayouts();
        
        // 重置视图并应用当前变换
        const currentTransform = d3.zoomTransform(svg.node());
        updateAdaptiveElements(currentTransform);
    }
    
    // 监听窗口大小变化
    const debouncedResize = debounce(resize, 250); // 添加250ms防抖
    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(container);

    // 开始加载数据
    loadData();
    
    // 返回可供外部调用的方法和清理函数
    return {
        resetView,
        destroy: () => {
            resizeObserver.disconnect();
        }
    };
} 