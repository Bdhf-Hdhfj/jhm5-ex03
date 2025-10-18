建立一個簡單的 Cloudflare Worker，使用 asset-directory（而非 site-bucket）提供公開資源，並提供 API 和 Cloudflare KV 服務。

index.html - 主要登陸頁面，展示所有可用的應用程式。提供清晰的導航介面，包含四個應用程式的卡片式連結（tictactoe、todo-local、todo-cloud、mathgame），每個卡片顯示應用程式名稱、簡短描述和圖示。使用響應式設計，適配不同螢幕尺寸。

App#1: tictactoe - 一個井字遊戲（圈圈叉叉）應用程式，支援 single player (minimax) and 雙人對戰。遊戲狀態儲存在 localstorage 中，讓玩家可以儲存和載入遊戲進度。介面包含 3x3 的遊戲棋盤，顯示當前玩家，並在遊戲結束時宣布勝者或平局。

App#2: todo-local - 一個待辦事項（To-Do List）應用程式，使用瀏覽器的 LocalStorage 儲存資料。使用者可以新增、編輯、刪除和標記完成待辦事項。介面顯示所有待辦事項清單，支援篩選顯示（全部、未完成、已完成）。資料完全儲存在本地端，不需要伺服器連線。

App#3: todo-cloud - 一個雲端版待辦事項應用程式，使用 Cloudflare KV 儲存資料。功能與 todo-local 相似，但資料儲存在雲端，可以跨裝置同步。透過 API 端點與 Cloudflare Worker 後端通訊，實現新增、讀取、更新和刪除（CRUD）待辦事項的功能。支援多使用者，每個使用者有獨立的待辦事項清單。

App#4: mathgame - 一個限時反應數學遊戲應用程式，連續快速產生數學題目（加減乘除）測試使用者的反應速度和計算能力。可以選擇難度等級（簡單、中等、困難），遊戲在限定時間內進行，挑戰玩家在時間內答對最多題目。使用 Cloudflare KV 儲存遊戲記錄和高分排行榜。介面顯示當前題目、倒數計時器、目前分數和連續答對次數，並在答題後立即顯示正確或錯誤的回饋，答錯時扣分或結束遊戲。