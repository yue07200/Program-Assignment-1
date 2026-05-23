/*
==========================================================================
DFS 深度優先搜尋 (尋找最多設施的最佳解，包含年齡過濾機制)
==========================================================================
*/

let bestPaths = [];
let bestVisited = 0;
let bestTime = Infinity;
let bestCost = Infinity;
let bestScore = -Infinity; 

function findBestRoute(startNode, timeLimit, moneyLimit, userAge) {
    bestPaths = [];
    bestVisited = 0;
    bestTime = Infinity;
    bestCost = Infinity;
    bestScore = -Infinity;

    if (userAge < vertices[startNode].ageLimit) {
        return { found: false, paths: [], reason: "您的年齡未達起點設施限制" };
    }

    let initialTime = vertices[startNode].playTime + vertices[startNode].queueTime;
    let initialCost = vertices[startNode].cost;
    let initialScore = vertices[startNode].popularity; 

    if (initialTime > timeLimit || initialCost > moneyLimit) {
        return { found: false, paths: [], reason: "您的時間或預算不足以遊玩起點" };
    }

    let visited = new Set([startNode]);
    
    dfsSearch(startNode, startNode, timeLimit, moneyLimit, userAge, initialTime, initialCost, initialScore, visited, [startNode]);

    return {
        found: bestPaths.length > 0,
        paths: bestPaths,
        visited: bestVisited,
        totalTime: bestTime,
        totalCost: bestCost,
        totalScore: bestScore
    };
}

function dfsSearch(currentNode, startNode, timeLimit, moneyLimit, userAge, currentTime, currentCost, currentScore, visited, path) {
    let returnEdge = graph[currentNode].find(e => e.to === startNode);
    
    if (returnEdge) {
        let totalLoopTime = currentTime + returnEdge.travelTime;
        let totalLoopCost = currentCost + returnEdge.travelCost;
        
        if (totalLoopTime <= timeLimit && totalLoopCost <= moneyLimit) {
            let cyclePath = [...path, startNode];
            
            if (visited.size > bestVisited) {
                bestVisited = visited.size;
                bestTime = totalLoopTime;
                bestCost = totalLoopCost;
                bestScore = currentScore;
                bestPaths = [cyclePath];
            } else if (visited.size === bestVisited) {
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestTime = totalLoopTime;
                    bestCost = totalLoopCost;
                    bestPaths = [cyclePath];
                } else if (currentScore === bestScore && totalLoopTime < bestTime) {
                    bestTime = totalLoopTime;
                    bestCost = totalLoopCost;
                    bestPaths = [cyclePath];
                }
            }
        }
    }

    for (let edge of graph[currentNode]) {
        let nextNode = edge.to;
        if (visited.has(nextNode)) continue;

        let nextVertex = vertices[nextNode];

        if (userAge < nextVertex.ageLimit) continue;

        let nextTime = currentTime + edge.travelTime + nextVertex.playTime + nextVertex.queueTime;
        let nextCost = currentCost + edge.travelCost + nextVertex.cost;
        let nextScore = currentScore + nextVertex.popularity; 

        if (nextTime > timeLimit || nextCost > moneyLimit) continue;

        visited.add(nextNode);
        path.push(nextNode);

        dfsSearch(nextNode, startNode, timeLimit, moneyLimit, userAge, nextTime, nextCost, nextScore, visited, path);

        path.pop();
        visited.delete(nextNode);
    }
}