/*
=================================================
DFS 深度優先搜尋 (尋找最多設施的最佳解，包含年齡過濾機制)
=================================================
*/

// bestPaths：用來儲存「所有最佳路徑」，因為可能有：1 → 2 → 3 → 1，以及：1 → 2 → 5 → 1，兩條都一樣好，所以要用陣列儲存多條最佳解
// bestVisited：目前最佳解拜訪了幾個節點，例如：1 → 2 → 3 → 1，拜訪了：1、2、3，所以 visited.size = 3
// bestTime：目前最佳解所花費的總時間，一開始設成 Infinity（無限大），因為任何正常時間都會比 Infinity 小方便後續比較
// bestCost：目前最佳解所花費的總金額，一開始設成 Infinity（無限大），因為任何正常金額都會比 Infinity 小方便後續比較
// bestScore：目前最佳解的總人氣分數，一開始設成 -Infinity（負無限大），因為任何正常分數都會比 -Infinity 大方便後續比較

let bestPaths = [];
let bestVisited = 0;
let bestTime = Infinity;
let bestCost = Infinity;
let bestScore = -Infinity; 

/* 主函式 */
// findBestRoute()：尋找最佳遊玩路線，參數：startNode: 起始節點，timeLimit: 總時間限制，moneyLimit: 總預算限制，userAge: 使用者年齡

function findBestRoute(startNode, timeLimit, moneyLimit, userAge) {

    // 每次重新搜尋前：都要重設最佳解，避免上一次結果殘留
    bestPaths = []; // 重設最佳路徑陣列，清空之前的結果
    bestVisited = 0; // 重設最佳拜訪數，回到初始狀態
    bestTime = Infinity; // 重設最佳時間，回到初始狀態
    bestCost = Infinity; // 重設最佳金額，回到初始狀態
    bestScore = -Infinity; // 重設最佳人氣分數，回到初始狀態

    // 年齡過濾：如果使用者年齡未達起點設施的限制，直接回傳找不到解
    if (userAge < vertices[startNode].ageLimit) {
        return { 
            found: false, // 沒有找到可行路徑(解)
            paths: [], // 沒有最佳路徑，所以是空陣列
            reason: "您的年齡未達起點設施限制" // 回傳找不到解的原因
        };
    }

    // 初始時間、金額和人氣分數：從起點開始就已經花了該設施的遊玩時間、金額，並且獲得了該設施的人氣分數
    // queueTime 也要算在內，因為排隊也是時間的一部分
    let initialTime = vertices[startNode].playTime + vertices[startNode].queueTime;
    let initialCost = vertices[startNode].cost;
    let initialScore = vertices[startNode].popularity; 

    // 如果起點的時間或金額已經超過限制了，直接回傳找不到解
    if (initialTime > timeLimit || initialCost > moneyLimit) {
        return { 
            found: false, 
            paths: [], 
            reason: "時間或預算不足以遊玩起點" 
        };
    }

    // visited：記錄已經拜訪過的節點，使用 Set，因為 Set 不會重複存資料，很適合記錄「哪些節點已經去過」
    let visited = new Set([startNode]);
    
    // 開始 DFS 搜尋
    dfsSearch(startNode, startNode, timeLimit, moneyLimit, userAge, initialTime, initialCost, initialScore, visited, [startNode]);

    // 回傳結果，包含：是否找到解、最佳路徑、拜訪的節點數、總時間、總金額和總人氣分數
    return {
        found: bestPaths.length > 0,
        paths: bestPaths,
        visited: bestVisited,
        totalTime: bestTime,
        totalCost: bestCost,
        totalScore: bestScore
    };
}

/* DFS + Backtracking */
// DFS：深度優先搜尋，會一直往下探索路徑，例如：1 → 2 → 3 → 4 直到：超時、無法繼續、已拜訪，才會回退（Backtracking）
// dfsSearch()：DFS 搜尋函式，參數：currentNode: 目前節點，startNode: 起始節點，timeLimit: 總時間限制，moneyLimit: 總預算限制，userAge: 使用者年齡，currentTime: 目前已花費的時間，currentCost: 目前已花費的金額，currentScore: 目前獲得的人氣分數，visited: 已拜訪的節點集合，path: 目前的路徑
function dfsSearch(currentNode, startNode, timeLimit, moneyLimit, userAge, currentTime, currentCost, currentScore, visited, path) {
    
    // 嘗試回到起點，形成一個 cycle，前提是：必須有從 currentNode 回到 startNode 的邊，並且回到起點的時間和金額都不能超過限制
    // 防範數字與字串混用，所以都轉成字串來比較，確保不會因為類型不同而找不到邊！
    let returnEdge = graph[currentNode].find(e => e.to.toString() === startNode.toString());
    // 如果存在回到起點的邊，並且回到起點的時間和金額都在限制內，就算找到一個可行的 cycle 解
    if (returnEdge) {

        // 計算回到起點的總時間和總金額，包含從 currentNode 回到 startNode 的 travelTime 和 travelCost，以及回到起點後的遊玩時間、排隊時間和成本
        let totalLoopTime = currentTime + returnEdge.travelTime;
        let totalLoopCost = currentCost + returnEdge.travelCost;
        
        // 回到起點後的遊玩時間、排隊時間和成本
        if (totalLoopTime <= timeLimit && totalLoopCost <= moneyLimit) {

            /* 建立完整 cycle */
            // cyclePath：目前路徑 + 回到起點的動作，形成完整 cycle
            // path:[1,2,3] 加上 startNode 後：[1,2,3,1]
            let cyclePath = [...path, startNode];
            
            // 判斷條件：visited.size > bestVisited，代表：這條路徑拜訪更多景點(找到更好的解)
            if (visited.size > bestVisited) {
                bestVisited = visited.size; // 更新最佳拜訪數
                bestTime = totalLoopTime; // 更新最佳時間
                bestCost = totalLoopCost; // 更新最佳金額
                bestScore = currentScore; // 更新最佳人氣分數
                bestPaths = [cyclePath]; // 更新最佳路徑，因為找到更好的解了，所以之前的解都不算了，直接用新的解覆蓋掉
            }
            // 如果拜訪數一樣多，就比較人氣分數，人氣分數高的才是更好的解
            else if (visited.size === bestVisited) {
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestTime = totalLoopTime;
                    bestCost = totalLoopCost;
                    bestPaths = [cyclePath];
                }
                // 如果人氣分數也一樣，就比較時間，時間少的才是更好的解
                else if (currentScore === bestScore && totalLoopTime < bestTime) {
                    bestTime = totalLoopTime;
                    bestCost = totalLoopCost;
                    bestPaths = [cyclePath];
                }
            }
        }
    }

    // 嘗試繼續往下探索其他鄰居節點，前提是：下一個節點沒有被拜訪過，使用者年齡符合限制，前往下一個節點的時間和金額都在限制內
    for (let edge of graph[currentNode]) {

        let nextNode = edge.to;

        // 如果已經拜訪過就跳過，避免：1 → 2 → 1 → 2 → 1 無限循環
        if (visited.has(nextNode)) continue;

        let nextVertex = vertices[nextNode];

        // 年齡過濾：如果使用者年齡未達下一個節點設施的限制，跳過這個鄰居
        if (userAge < nextVertex.ageLimit) continue;

        // 計算前往下一節點後的時間、金額和人氣分數
        // 包含目前已花費的時間 + 移動到下一個節點的時間 + 下一個節點的遊玩時間 + 下一個節點的排隊時間
        // 以及目前已花費的金額 + 移動到下一個節點的金額 + 下一個節點的成本
        // 以及目前獲得的人氣分數 + 下一個節點的人氣分數
        let nextTime = currentTime + edge.travelTime + nextVertex.playTime + nextVertex.queueTime;
        let nextCost = currentCost + edge.travelCost + nextVertex.cost;
        let nextScore = currentScore + nextVertex.popularity; 

        // 如果前往下一個節點後的時間或金額超過限制了，就跳過這個鄰居，不繼續往下搜尋，避免浪費時間在不可能的路徑上
        if (nextTime > timeLimit || nextCost > moneyLimit) continue;

        // 標記下一個節點為已拜訪，並且把它加入目前的路徑中，然後繼續往下搜尋
        visited.add(nextNode);
        path.push(nextNode);

        // Recursive DFS 遞迴繼續搜尋，這裡的 DFS() 是遞迴呼叫，會一直往下搜尋，直到：超時、無法繼續、已拜訪，才會回退（Backtracking）
        dfsSearch(nextNode, startNode, timeLimit, moneyLimit, userAge, nextTime, nextCost, nextScore, visited, path);

        // 移除路徑最後一個節點，因為剛剛 path.push(nextNode) 加入了下一個節點，所以現在要把它移除，回到上一層狀態，準備嘗試其他路徑
        path.pop();

        // 回退（Backtracking），撤銷剛剛的選擇，準備嘗試其他路徑
        // Backtracking，DFS 回來後：要還原狀態，才能測試其他路徑
        /* 移除已拜訪 */
        visited.delete(nextNode);
    }
}