/*
==========================================================================
Cytoscape 地圖渲染與時間軸動態連動引擎 (RWD 響應式優化版)
==========================================================================
*/

let isLightMode = false;
let currentActivePath = null;

const cy = cytoscape({
    container: document.getElementById("cy"),
    userZoomingEnabled: true,  /* ✨ 開啟使用者縮放，方便手機用戶雙指放大 */
    userPanningEnabled: true,  /* ✨ 開啟使用者平移，方便手機用戶滑動地圖 */
    wheelSensitivity: 0.2,     /* 降低滑鼠滾輪縮放的靈敏度 */
    autoungrabify: true,
    style: [
        {
            selector: 'node',
            style: {
                'background-color': '#1e293b',
                'label': 'data(label)',
                'text-wrap': 'wrap',
                'color': '#ffffff',             
                'font-size': '15px',            
                'font-weight': 'bold',
                'line-height': 1.4,             
                'text-valign': 'center',
                'text-halign': 'center',
                'width': '155px',               
                'height': '155px',
                'border-width': '2px',
                'border-color': '#475569'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#475569',
                'label': 'data(label)',
                'font-size': '13px',            
                'font-weight': 'bold',
                'color': '#cbd5e1',
                'curve-style': 'bezier',
                'control-point-step-size': 45,  
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#475569',
                'target-arrow-scale': 1.0,     
                'text-background-opacity': 0.85,
                'text-background-color': '#0f172a',
                'text-background-padding': '4px',
                'edge-text-rotation': 'autorotate' 
            }
        }
    ]
});

// 動態加載地圖節點與邊
function loadGraphToCanvas() {
    cy.remove('*');
    Object.keys(vertices).forEach(id => {
        let v = vertices[id];
        let totalTime = v.playTime + v.queueTime;
        cy.add({
            group: 'nodes',
            data: { 
                id: id, 
                label: `【${id}. ${v.name}】\n(${totalTime}分 | 限${v.ageLimit}+)\n💵門票: $${v.cost}\n⭐熱度: ${v.popularity}` 
            }
        });
    });

    Object.keys(graph).forEach(fromNode => {
        graph[fromNode].forEach(edge => {
            cy.add({
                group: 'edges',
                data: { id: `e_${fromNode}_${edge.to}`, source: fromNode, target: edge.to, label: `${edge.travelTime}分 / $${edge.travelCost}` }
            });
        });
    });
    
    // ✨ 響應式優化：根據當前螢幕寬度決定初始半徑 ✨
    let mapRadius = window.innerWidth < 768 ? 160 : 260;
    cy.layout({ name: 'circle', radius: mapRadius }).run();
    
    // ✨ 讓地圖自動縮放以完美填滿容器 (Padding 30px) ✨
    cy.fit(cy.elements(), 30);
}

loadGraphToCanvas();

// ✨ 監聽瀏覽器視窗大小變化，確保地圖隨時保持居中與自適應大小 ✨
window.addEventListener('resize', () => {
    cy.fit(cy.elements(), 30);
});

// 明暗模式切換監聽器
document.getElementById("themeToggle").addEventListener("click", () => {
    isLightMode = !isLightMode;
    document.body.classList.toggle('light-theme', isLightMode);
    document.getElementById("themeToggle").innerHTML = isLightMode ? '🌙 暗色模式' : '🌞 亮色模式';
    
    updateMapTheme();
});

// 動態更新 Cytoscape 地圖樣式
function updateMapTheme() {
    const nodeBg = isLightMode ? '#ffffff' : '#1e293b';
    const nodeColor = isLightMode ? '#0f172a' : '#ffffff';
    const borderColor = isLightMode ? '#cbd5e1' : '#475569';
    const edgeLine = isLightMode ? '#94a3b8' : '#475569';
    const edgeText = isLightMode ? '#475569' : '#cbd5e1';
    const edgeTextBg = isLightMode ? '#f8fafc' : '#0f172a';

    cy.style()
      .selector('node').style({
          'background-color': nodeBg,
          'color': nodeColor,
          'border-color': borderColor
      })
      .selector('edge').style({
          'line-color': edgeLine,
          'target-arrow-color': edgeLine,
          'color': edgeText,
          'text-background-color': edgeTextBg
      })
      .update();

    if (currentActivePath) {
        highlightPathOnMap(currentActivePath);
    }
}

// 「開始規劃最佳路線」按鈕監聽器
document.getElementById("btnOptimize").addEventListener("click", () => {
    const startNode = parseInt(document.getElementById("startNodeSelect").value);
    const timeLimit = parseInt(document.getElementById("timeLimitInput").value);
    const moneyLimit = parseInt(document.getElementById("moneyLimitInput").value);
    const userAge = parseInt(document.getElementById("ageInput").value);

    const dfsResult = findBestRoute(startNode, timeLimit, moneyLimit, userAge);
    const greedyResult = findGreedyRoute(startNode, timeLimit, moneyLimit, userAge);

    renderDataAndTimeline(dfsResult, greedyResult);
});

function renderDataAndTimeline(dfs, greedy) {
    if (dfs.found) {
        document.getElementById("compDfsPath").innerText = dfs.paths[0].map(id => vertices[id].name).join(" ➔ ");
        document.getElementById("compDfsCount").innerText = `${dfs.visited} 個設施`;
        document.getElementById("compDfsTime").innerText = `${dfs.totalTime} 分鐘`;
        document.getElementById("compDfsCost").innerText = `$${dfs.totalCost} 元`;
        document.getElementById("compDfsScore").innerText = dfs.totalScore; 
        
        highlightPathOnMap(dfs.paths[0]);
        buildItineraryTimeline(dfs.paths[0]);
    } else {
        document.getElementById("compDfsPath").innerText = "無法形成路線";
        document.getElementById("compDfsCount").innerText = dfs.reason || "條件太嚴格";
        document.getElementById("compDfsTime").innerText = "-";
        document.getElementById("compDfsCost").innerText = "-";
        document.getElementById("compDfsScore").innerText = "-";
    }

    if (greedy.found) {
        document.getElementById("compGreedyPath").innerText = greedy.path.map(id => vertices[id].name).join(" ➔ ");
        document.getElementById("compGreedyCount").innerText = `${greedy.visited} 個設施`;
        document.getElementById("compGreedyTime").innerText = `${greedy.totalTime} 分鐘`;
        document.getElementById("compGreedyCost").innerText = `$${greedy.totalCost} 元`;
        document.getElementById("compGreedyScore").innerText = greedy.totalScore; 
        
        if (!dfs.found) {
            highlightPathOnMap(greedy.path);
            buildItineraryTimeline(greedy.path);
        }
    } else {
        document.getElementById("compGreedyPath").innerText = "無法形成路線";
        document.getElementById("compGreedyCount").innerText = greedy.reason || "條件太嚴格";
        document.getElementById("compGreedyTime").innerText = "-";
        document.getElementById("compGreedyCost").innerText = "-";
        document.getElementById("compGreedyScore").innerText = "-";
    }
}

// 在 Cytoscape 地圖上高亮繪製最佳路線
function highlightPathOnMap(path) {
    currentActivePath = path; 

    const baseNodeBg = isLightMode ? '#ffffff' : '#1e293b';
    const baseBorder = isLightMode ? '#cbd5e1' : '#475569';
    const baseEdge = isLightMode ? '#94a3b8' : '#475569';

    cy.nodes().style({ 'background-color': baseNodeBg, 'border-color': baseBorder });
    cy.edges().style({ 'line-color': baseEdge, 'target-arrow-color': baseEdge, 'width': 2 });

    path.forEach(nodeId => {
        cy.getElementById(nodeId.toString()).style({ 
            'background-color': '#10b981', 
            'border-color': isLightMode ? '#0f172a' : '#ffffff' 
        });
    });
    for (let i = 0; i < path.length - 1; i++) {
        cy.getElementById(`e_${path[i]}_${path[i+1]}`).style({ 
            'line-color': '#ef4444', 
            'target-arrow-color': '#ef4444', 
            'width': 4 
        });
    }
}

function buildItineraryTimeline(path) {
    const container = document.getElementById("timelineContainer");
    if (!container) return;
    
    container.innerHTML = "";
    let accumulatedTime = 0;
    let accumulatedCost = 0;

    for (let i = 0; i < path.length; i++) {
        const currentNodeId = path[i];
        const v = vertices[currentNodeId];
        const item = document.createElement("div");
        item.className = "timeline-item";
        item.innerHTML = `<div class="timeline-marker"></div>`;
        const content = document.createElement("div");
        content.className = "timeline-content";

        let facilityTotalTime = v.playTime + v.queueTime;

        if (i === 0) {
            accumulatedTime += facilityTotalTime;
            accumulatedCost += v.cost;
            content.innerHTML = `<h4 class="timeline-title">🏁 第一站：從【${v.name}】出發</h4>
                                 <p class="timeline-meta" style="line-height: 1.8;">
                                     ⏱️ <b>時間明細：</b>設施總耗時 ${facilityTotalTime} 分鐘<br>
                                     💰 <b>花費明細：</b>設施門票 $${v.cost}<br>
                                     <span style="color: #0ea5e9; font-weight: 600;">📈 累積狀態：已花費 ${accumulatedTime} 分鐘 ｜ 已消費 $${accumulatedCost} 元</span>
                                 </p>`;
        } else {
            const edge = graph[path[i-1]].find(e => e.to === currentNodeId);
            const tTime = edge ? edge.travelTime : 0;
            const tCost = edge ? edge.travelCost : 0;
            
            const isWalking = (tCost === 0);
            const travelAction = isWalking ? `🚶 步行` : `🚌 搭乘遊園車`;
            const travelIcon = isWalking ? `🚶` : `🚌`;

            accumulatedTime += tTime;
            accumulatedCost += tCost;

            if (i === path.length - 1) {
                const returnAction = isWalking ? `🚶 步行回程` : `🚌 搭車回程`;
                
                content.innerHTML = `<h4 class="timeline-title">🔄 最終站：安全回到原起點【${v.name}】</h4>
                                     <p class="timeline-meta" style="line-height: 1.8;">
                                         ⏱️ <b>時間明細：</b>${returnAction} ${tTime} 分鐘<br>
                                         💰 <b>花費明細：</b>交通費 $${tCost}<br>
                                         <span style="color: #10b981; font-weight: 600;">🏁 最終結算：共計花費 ${accumulatedTime} 分鐘 ｜ 總共消費 $${accumulatedCost} 元</span>
                                     </p>`;
            } else {
                accumulatedTime += facilityTotalTime;
                accumulatedCost += v.cost;
                content.innerHTML = `<h4 class="timeline-title">${travelIcon} 前往下一個地方：【${v.name}】</h4>
                                     <p class="timeline-meta" style="line-height: 1.8;">
                                         ⏱️ <b>時間明細：</b>${travelAction} ${tTime} 分鐘 ＋ 設施總耗時 ${facilityTotalTime} 分鐘<br>
                                         💰 <b>花費明細：</b>交通費 $${tCost} ＋ 設施門票 $${v.cost}<br>
                                         <span style="color: #0ea5e9; font-weight: 600;">📈 累積狀態：已花費 ${accumulatedTime} 分鐘 ｜ 已消費 $${accumulatedCost} 元</span>
                                     </p>`;
            }
        }
        item.appendChild(content);
        container.appendChild(item);
    }
}