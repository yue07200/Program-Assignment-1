/*
==========================================================================
Greedy Algorithm 貪婪演算法 (整合排隊時間與熱門度 CP 值評估公式)
==========================================================================
*/

function findGreedyRoute(startNode, timeLimit, moneyLimit, userAge) {
    if (userAge < vertices[startNode].ageLimit) {
        return { found: false, path: [], reason: "您的年齡未達起點設施限制" };
    }
    
    let visited = new Set([startNode]);
    let path = [startNode];
    let currentNode = startNode;
    
    let currentTime = vertices[startNode].playTime + vertices[startNode].queueTime;
    let currentCost = vertices[startNode].cost;
    let currentScore = vertices[startNode].popularity;

    while (true) {
        let bestNextNode = null;
        let bestEdge = null;
        let maxCPValue = -Infinity; 

        for (let edge of graph[currentNode]) {
            let nextNode = edge.to;
            if (visited.has(nextNode)) continue;

            let nextVertex = vertices[nextNode];
            if (userAge < nextVertex.ageLimit) continue;

            let nextTime = currentTime + edge.travelTime + nextVertex.playTime + nextVertex.queueTime;
            let nextCost = currentCost + edge.travelCost + nextVertex.cost;

            let backEdge = graph[nextNode].find(e => e.to === startNode);
            let estimatedReturnTime = backEdge ? backEdge.travelTime : Infinity;
            let estimatedReturnCost = backEdge ? backEdge.travelCost : Infinity;

            if ((nextTime + estimatedReturnTime > timeLimit) || (nextCost + estimatedReturnCost > moneyLimit)) {
                continue; 
            }

            let totalEffort = edge.travelTime + nextVertex.queueTime + nextVertex.cost;
            let cpValue = nextVertex.popularity / (totalEffort + 1);
            
            if (cpValue > maxCPValue) {
                maxCPValue = cpValue;
                bestNextNode = nextNode;
                bestEdge = edge;
            }
        }

        if (bestNextNode === null) break;

        currentTime += bestEdge.travelTime + vertices[bestNextNode].playTime + vertices[bestNextNode].queueTime;
        currentCost += bestEdge.travelCost + vertices[bestNextNode].cost;
        currentScore += vertices[bestNextNode].popularity;
        
        visited.add(bestNextNode);
        path.push(bestNextNode);
        currentNode = bestNextNode;
    }

    let returnEdge = graph[currentNode].find(e => e.to === startNode);
    if (!returnEdge) return { found: false, path: [], reason: "預算或時間不足以走回起點" };

    let finalTime = currentTime + returnEdge.travelTime;
    let finalCost = currentCost + returnEdge.travelCost;

    if (finalTime > timeLimit || finalCost > moneyLimit) {
        return { found: false, path: [], reason: "路線超時或超支" };
    }

    path.push(startNode);

    return {
        found: true,
        path: path,
        visited: visited.size,
        totalTime: finalTime,
        totalCost: finalCost,
        totalScore: currentScore
    };
}