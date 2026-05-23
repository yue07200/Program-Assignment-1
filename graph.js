/*
==========================================================================
景點頂點 (Vertices) 與路網邊 (Graph) 資料定義
==========================================================================
*/

const vertices = {
    1: { name: "雲霄飛車", playTime: 20, cost: 50, popularity: 5, queueTime: 40, ageLimit: 12 }, 
    2: { name: "摩天輪",   playTime: 15, cost: 30, popularity: 4, queueTime: 15, ageLimit: 0  },
    3: { name: "鬼屋",     playTime: 10, cost: 40, popularity: 3, queueTime: 10, ageLimit: 15 },
    4: { name: "海盜船",   playTime: 15, cost: 25, popularity: 4, queueTime: 25, ageLimit: 8  },
    5: { name: "滑水道",   playTime: 30, cost: 60, popularity: 5, queueTime: 50, ageLimit: 10 }
};

const graph = {
    1: [
        { to: 2, travelTime: 10, travelCost: 5 },
        { to: 3, travelTime: 20, travelCost: 10 },
        { to: 5, travelTime: 5, travelCost: 0 }
    ],
    2: [
        { to: 1, travelTime: 10, travelCost: 5 },
        { to: 3, travelTime: 10, travelCost: 5 },
        { to: 5, travelTime: 4, travelCost: 0 }
    ],
    3: [
        { to: 1, travelTime: 20, travelCost: 10 },
        { to: 2, travelTime: 10, travelCost: 5 },
        { to: 4, travelTime: 4, travelCost: 2 }
    ],
    4: [
        { to: 2, travelTime: 20, travelCost: 10 },
        { to: 3, travelTime: 4, travelCost: 2 },
        { to: 5, travelTime: 20, travelCost: 5 }
    ],
    5: [
        { to: 1, travelTime: 5, travelCost: 0 },
        { to: 2, travelTime: 4, travelCost: 0 },
        { to: 4, travelTime: 20, travelCost: 5 }
    ]
};