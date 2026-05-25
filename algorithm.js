let bestPath = [];
let bestVisited = 0;
let bestTime = 0;

function findBestRoute(startNode, timeLimit){

    bestPath = [];
    bestVisited = 0;
    bestTime = 0;

    let visited = new Set();

    visited.add(startNode);

    let initialTime = vertices[startNode].playTime;

    dfs(
        startNode,
        startNode,
        timeLimit,
        initialTime,
        visited,
        [startNode]
    );

    return {
        path: bestPath,
        visited: bestVisited,
        totalTime: bestTime
    };
}

function dfs(
    current,
    start,
    timeLimit,
    currentTime,
    visited,
    path
){

    if(
        visited.size > bestVisited
        &&
        currentTime <= timeLimit
    ){
        bestVisited = visited.size;
        bestPath = [...path];
        bestTime = currentTime;
    }

    for(let edge of graph[current]){

        let nextNode = edge.to;

        let travelTime = edge.travelTime;

        let nextTime =
            currentTime +
            travelTime +
            vertices[nextNode].playTime;

        if(nextTime > timeLimit){
            continue;
        }

        if(!visited.has(nextNode)){

            visited.add(nextNode);

            path.push(nextNode);

            dfs(
                nextNode,
                start,
                timeLimit,
                nextTime,
                visited,
                path
            );

            visited.delete(nextNode);

            path.pop();
        }
    }
}