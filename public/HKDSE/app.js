// Data will be fetched from the Worker API (/api/stats)
let hkdseData = [];
let isLoading = false;
let lastError = null;

// 初始化圖表
let scoreChart;

// 頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化表格
    populateTable();
    
    // 初始化圖表
    initializeChart();
    
    // 綁定查詢按鈕事件
    document.getElementById('query-btn').addEventListener('click', handleQuery);
    
    // 初始查詢
    // fetch data then run initial query
    fetchAndInit();
});

async function fetchAndInit() {
    isLoading = true;
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch data');
        const body = await res.json();
        hkdseData = body.data || [];
        lastError = null;
    } catch (err) {
        console.error('Error fetching HKDSE data', err);
        lastError = err;
        hkdseData = [];
    } finally {
        isLoading = false;
        populateTable();
        initializeChart();
        handleQuery();
    }
}

// 填充表格數據
function populateTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    if (lastError) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">Error loading data: ${lastError.message}</td>`;
        tableBody.appendChild(row);
        return;
    }

    if (isLoading) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">Loading data...</td>`;
        tableBody.appendChild(row);
        return;
    }

    hkdseData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.range}</td>
            <td>${item.dayCount.toLocaleString()}</td>
            <td>${item.dayPercentage}</td>
            <td>${item.allCount.toLocaleString()}</td>
            <td>${item.allPercentage}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 初始化圖表
function initializeChart() {
    const ctx = document.getElementById('score-chart').getContext('2d');
    
    const ranges = hkdseData.map(item => item.range);
    const dayCounts = hkdseData.map(item => item.dayCount);
    const allCounts = hkdseData.map(item => item.allCount);
    
    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges,
            datasets: [
                {
                    label: '日校考生人數',
                    data: dayCounts,
                    backgroundColor: 'rgba(26, 41, 128, 0.7)',
                    borderColor: 'rgba(26, 41, 128, 1)',
                    borderWidth: 1
                },
                {
                    label: '全體考生人數',
                    data: allCounts,
                    backgroundColor: 'rgba(38, 208, 206, 0.7)',
                    borderColor: 'rgba(38, 208, 206, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '考生人數'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '積分範圍'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'HKDSE成績分布'
                }
            }
        }
    });
}

// 處理查詢
function handleQuery() {
    const scoreRange = document.getElementById('score-range').value;
    const category = document.getElementById('category').value;
    
    let filteredData;
    
    if (scoreRange === 'all') {
        filteredData = hkdseData;
    } else {
        filteredData = hkdseData.filter(item => item.range === scoreRange);
    }
    
    // 更新統計數據
    updateStats(filteredData, category);
    
    // 更新圖表
    updateChart(filteredData, category);
}

// 更新統計數據
function updateStats(data, category) {
    const queryCountElement = document.getElementById('query-count');
    const queryPercentageElement = document.getElementById('query-percentage');
    
    if (data.length === 1) {
        // 單一積分範圍
        const item = data[0];
        
        if (category === 'day' || category === 'both') {
            queryCountElement.textContent = item.dayCount.toLocaleString();
            queryPercentageElement.textContent = item.dayPercentage;
        } else if (category === 'all') {
            queryCountElement.textContent = item.allCount.toLocaleString();
            queryPercentageElement.textContent = item.allPercentage;
        }
    } else {
        // 所有積分範圍
        let dayTotal = 0;
        let allTotal = 0;
        
        data.forEach(item => {
            dayTotal += item.dayCount;
            allTotal += item.allCount;
        });
        
        if (category === 'day' || category === 'both') {
            queryCountElement.textContent = dayTotal.toLocaleString();
            queryPercentageElement.textContent = ((dayTotal / 40666) * 100).toFixed(1) + '%';
        } else if (category === 'all') {
            queryCountElement.textContent = allTotal.toLocaleString();
            queryPercentageElement.textContent = ((allTotal / 49026) * 100).toFixed(1) + '%';
        }
    }
}

// 更新圖表
function updateChart(data, category) {
    const ranges = data.map(item => item.range);
    const dayCounts = data.map(item => item.dayCount);
    const allCounts = data.map(item => item.allCount);
    
    scoreChart.data.labels = ranges;
    
    if (category === 'day') {
        scoreChart.data.datasets = [
            {
                label: '日校考生人數',
                data: dayCounts,
                backgroundColor: 'rgba(26, 41, 128, 0.7)',
                borderColor: 'rgba(26, 41, 128, 1)',
                borderWidth: 1
            }
        ];
    } else if (category === 'all') {
        scoreChart.data.datasets = [
            {
                label: '全體考生人數',
                data: allCounts,
                backgroundColor: 'rgba(38, 208, 206, 0.7)',
                borderColor: 'rgba(38, 208, 206, 1)',
                borderWidth: 1
            }
        ];
    } else {
        scoreChart.data.datasets = [
            {
                label: '日校考生人數',
                data: dayCounts,
                backgroundColor: 'rgba(26, 41, 128, 0.7)',
                borderColor: 'rgba(26, 41, 128, 1)',
                borderWidth: 1
            },
            {
                label: '全體考生人數',
                data: allCounts,
                backgroundColor: 'rgba(38, 208, 206, 0.7)',
                borderColor: 'rgba(38, 208, 206, 1)',
                borderWidth: 1
            }
        ];
    }
    
    scoreChart.update();
}

// 模擬從Cloudflare D1獲取數據的函數
// 在實際應用中，這裡應該替換為真實的API調用
async function fetchDataFromD1() {
    // 模擬API延遲
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 返回模擬數據
    return hkdseData;
}