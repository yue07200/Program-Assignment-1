/*
==========================================================================
Greedy Algorithm 貪婪演算法 (整合排隊時間與熱門度 CP 值評估公式)
==========================================================================
*/

// 貪婪演算法函式，參數：startNode: 起始節點，timeLimit: 總時間限制，moneyLimit: 總預算限制，userAge: 使用者年齡
function findGreedyRoute(startNode, timeLimit, moneyLimit, userAge) {

    // 年齡過濾：如果使用者年齡未達起點設施的限制，直接回傳找不到解
    if (userAge < vertices[startNode].ageLimit) {
        return { 
            found: false, // 沒有找到可行路徑(解)
            paths: [], // 沒有最佳路徑，所以是空陣列
            reason: "您的年齡未達起點設施限制" // 回傳找不到解的原因
        };
    }

    // visited：記錄已經拜訪過的節點，使用 Set，因為 Set 不會重複存資料，很適合記錄「哪些節點已經去過」
    // path：目前的路徑，一開始只有起點
    // currentNode：目前所在的節點，一開始就是起點
    let visited = new Set([startNode]);
    let path = [startNode];
    let currentNode = startNode;
    
    // 初始時間、金額和人氣分數：從起點開始就已經花了該設施的遊玩時間、金額，並且獲得了該設施的人氣分數
    // queueTime 也要算在內，因為排隊也是時間的一部分
    let currentTime = vertices[startNode].playTime + vertices[startNode].queueTime;
    let currentCost = vertices[startNode].cost;
    let currentScore = vertices[startNode].popularity;

    // 如果起點的時間或金額已經超過限制了，直接回傳找不到解
    if (currentTime > timeLimit || currentCost > moneyLimit) {
        return { 
            found: false, 
            paths: [], 
            reason: "時間或預算不足以遊玩起點" 
        };
    }

    /* 開始 Greedy 搜尋 */
    while (true) {

        /* 儲存最佳下一節點 */
        let bestNextNode = null; // 最佳下一節點，一開始是 null，代表還沒找到合適的下一節點
        let bestEdge = null; // 最佳邊，一開始是 null，代表還沒找到合適的下一節點，所以也沒有對應的邊
        let maxCPValue = -Infinity; // 用來存鄰居中最大的 CP 值，初始值是 -Infinity，代表還沒找到任何鄰居，所以 CP 值可以是任意值

        /* 檢查所有鄰居 */
        for (let edge of graph[currentNode]) {

            let nextNode = edge.to;

            /* 已拜訪過 → 跳過 */
            if (visited.has(nextNode)) continue;

            let nextVertex = vertices[nextNode];

            // 年齡過濾：如果使用者年齡未達下一節點設施的限制，跳過這個鄰居
            if (userAge < nextVertex.ageLimit) continue;

            // 目前已花費的時間 + 移動到下一個節點的時間 + 下一個節點的遊玩時間 + 下一個節點的排隊時間
            // 目前已花費的金額 + 移動到下一個節點的金額 + 下一個節點的成本
            let nextTime = currentTime + edge.travelTime + nextVertex.playTime + nextVertex.queueTime;
            let nextCost = currentCost + edge.travelCost + nextVertex.cost;

            /* 計算回程時間與成本 */
            // 預估從下一節點回到起點的時間和成本，這樣才能確保選擇這個鄰居後，最後能在時間和預算內回到起點
            let backEdge = graph[nextNode].find(e => e.to.toString() === startNode.toString());
            let estimatedReturnTime = backEdge ? backEdge.travelTime : Infinity;
            let estimatedReturnCost = backEdge ? backEdge.travelCost : Infinity;

            // 如果前往下一個節點以及加上連回起點的時間或金額超過限制了，就跳過這個鄰居，不繼續往下搜尋，避免浪費時間在不可能的路徑上
            if ((nextTime + estimatedReturnTime > timeLimit) || (nextCost + estimatedReturnCost > moneyLimit)) {
                continue; 
            }

            // 計算 CP 值：人氣分數 / (走路時間 + 遊玩時間 + 排隊時間 + 成本)
            // CP 值越高代表「花費的時間和金錢越少，但獲得的人氣分數越多」，是更划算的選擇
            let totalEffort = edge.travelTime + nextVertex.playTime + nextVertex.queueTime + edge.travelCost + nextVertex.cost;
            let cpValue = nextVertex.popularity / (totalEffort + 1);
            
            if (cpValue > maxCPValue) {
                maxCPValue = cpValue;
                bestNextNode = nextNode;
                bestEdge = edge;
            }
        }

        // 如果檢查完所有鄰居後，bestNextNode 還是 null，代表沒有找到合適的下一節點了，那就結束搜尋
        if (bestNextNode === null) break;

        // 確立前進：更新時間、金額和人氣分數
        currentTime += bestEdge.travelTime + vertices[bestNextNode].playTime + vertices[bestNextNode].queueTime;
        currentCost += bestEdge.travelCost + vertices[bestNextNode].cost;
        currentScore += vertices[bestNextNode].popularity;
        
        // 更新已拜訪、路徑和目前節點
        visited.add(bestNextNode);
        path.push(bestNextNode);
        currentNode = bestNextNode;
    }

    // 回到起點：檢查從目前節點回到起點的邊，確保能在時間和預算內回到起點
    let returnEdge = graph[currentNode].find(e => e.to.toString() === startNode.toString());

    // 如果沒有回程邊了，代表：預算或時間不足以走回起點了，那就直接回傳找不到解的結果，不需要繼續往下算了
    if (!returnEdge) {
        return { 
            found: false, // 沒有找到可行路徑(解)
            path: [], // 沒有最佳路徑，所以是空陣列
            reason: "預算或時間不足以走回起點" // 回傳找不到解的原因
        };
    }

    // 計算回到起點後的總時間和總金額，包含目前已花費的時間和金額，以及回程的時間和金額
    let finalTime = currentTime + returnEdge.travelTime;
    let finalCost = currentCost + returnEdge.travelCost;

    // 如果回到起點後的時間或金額超過限制了，代表：這條路徑雖然走到這裡了，但最後無法在時間和預算內回到起點了，那就直接回傳找不到解的結果，不需要繼續往下算了
    if (finalTime > timeLimit || finalCost > moneyLimit) {
        return { 
            found: false,
            path: [],
            reason: "路線超時或超支"
        };
    }

    // 如果回到起點後的時間和金額都在限制內了，代表：找到一條可行的路徑了，那就建立完整的 cycle 路徑，並且回傳結果
    // 把起點加入目前的路徑中，形成完整的 cycle 路徑，因為題目要求最後要回到起點，所以 cycle 路徑才是完整的解
    path.push(startNode);

    // 包含：是否找到解、路徑、拜訪的節點數、總時間、總金額和總人氣分數
    return {
        found: true,
        path: path,
        visited: visited.size,
        totalTime: finalTime,
        totalCost: finalCost,
        totalScore: currentScore
    };
}
