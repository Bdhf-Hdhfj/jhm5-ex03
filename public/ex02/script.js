// 定義全域變數
let tasks = []; // 儲存所有任務的陣列
let currentFilter = 'all'; // 當前篩選條件
let editingTaskId = null; // 正在編輯的任務ID

// DOM元素
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const tasksCount = document.getElementById('tasksCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const closeModal = document.querySelector('.close');

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    loadTasks(); // 從localStorage載入任務
    renderTasks(); // 渲染任務列表
    setupEventListeners(); // 設置事件監聽器
});

// 設置事件監聽器
function setupEventListeners() {
    // 新增任務按鈕點擊事件
    addTaskBtn.addEventListener('click', addTask);
    
    // 按下Enter鍵新增任務
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // 清除已完成任務按鈕點擊事件
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // 篩選按鈕點擊事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按鈕的active類別
            filterBtns.forEach(b => b.classList.remove('active'));
            // 為當前按鈕添加active類別
            btn.classList.add('active');
            // 更新篩選條件並重新渲染任務
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // 關閉模態框按鈕
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // 點擊模態框外部關閉
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // 儲存編輯的任務
    saveEditBtn.addEventListener('click', saveEditedTask);
}

// 新增任務函數
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('請輸入待辦事項內容！');
        return;
    }
    
    // 建立新任務物件
    const newTask = {
        id: Date.now(), // 使用時間戳作為唯一ID
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask); // 將新任務添加到陣列
    saveTasks(); // 儲存到localStorage
    renderTasks(); // 重新渲染任務列表
    
    taskInput.value = ''; // 清空輸入框
    taskInput.focus(); // 聚焦到輸入框
}

// 渲染任務列表
function renderTasks() {
    // 根據篩選條件獲取任務
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    // 清空任務列表
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        // 如果沒有任務，顯示提示訊息
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 
            currentFilter === 'all' ? '目前沒有待辦事項' :
            currentFilter === 'active' ? '沒有待完成的任務' :
            '沒有已完成的任務';
        taskList.appendChild(emptyMessage);
    } else {
        // 渲染每個任務
        filteredTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }
    
    // 更新任務計數
    updateTasksCount();
}

// 建立任務元素
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) {
        li.classList.add('completed');
    }
    
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-content">${task.text}</span>
        <div class="task-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    
    // 添加事件監聽器
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));
    
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openEditModal(task));
    
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return li;
}

// 切換任務完成狀態
function toggleTaskCompleted(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
}

// 打開編輯模態框
function openEditModal(task) {
    editingTaskId = task.id;
    editTaskInput.value = task.text;
    editModal.style.display = 'flex';
    editTaskInput.focus();
}

// 儲存編輯後的任務
function saveEditedTask() {
    const newText = editTaskInput.value.trim();
    
    if (newText === '') {
        alert('待辦事項內容不能為空！');
        return;
    }
    
    tasks = tasks.map(task => {
        if (task.id === editingTaskId) {
            return { ...task, text: newText };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    editModal.style.display = 'none';
    editingTaskId = null;
}

// 刪除任務
function deleteTask(taskId) {
    if (confirm('確定要刪除這個待辦事項嗎？')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// 清除已完成任務
function clearCompletedTasks() {
    if (confirm('確定要清除所有已完成的待辦事項嗎？')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
}

// 更新任務計數
function updateTasksCount() {
    const activeTasksCount = tasks.filter(task => !task.completed).length;
    tasksCount.textContent = `${activeTasksCount} 個待辦事項`;
}

// 儲存任務到localStorage
async function saveTasks() {
    await fetch("https://todo-api.llf201196.workers.dev/?key=tasks", {
        method: "POST",
        body: JSON.stringify(tasks),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

// 從localStorage載入任務
async function loadTasks() {
    const res = await fetch("https://todo-api.llf201196.workers.dev/?key=tasks"
    );
    const storedTasks = await res.json(tasks);
    tasks = storedTasks;
    
}