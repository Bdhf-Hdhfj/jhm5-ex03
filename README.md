建立一個簡單的 Cloudflare Worker，使用 asset-directory（而非 site-bucket）提供公開資源，並提供 API 和 Cloudflare KV 服務。

index.html - 主要登陸頁面，展示所有可用的應用程式。提供清晰的導航介面，包含四個應用程式的卡片式連結（tictactoe、todo-local、todo-cloud、mathgame），每個卡片顯示應用程式名稱、簡短描述和圖示。使用響應式設計，適配不同螢幕尺寸。

App#1: tictactoe - 一個井字遊戲（圈圈叉叉）應用程式，支援 single player (minimax) and 雙人對戰。遊戲狀態儲存在 localstorage 中，讓玩家可以儲存和載入遊戲進度。介面包含 3x3 的遊戲棋盤，顯示當前玩家，並在遊戲結束時宣布勝者或平局。

App#2: todo-local - 一個待辦事項（To-Do List）應用程式，使用瀏覽器的 LocalStorage 儲存資料。使用者可以新增、編輯、刪除和標記完成待辦事項。介面顯示所有待辦事項清單，支援篩選顯示（全部、未完成、已完成）。資料完全儲存在本地端，不需要伺服器連線。

App#3: todo-cloud - 一個雲端版待辦事項應用程式，使用 Cloudflare KV 儲存資料。功能與 todo-local 相似，但資料儲存在雲端，可以跨裝置同步。透過 API 端點與 Cloudflare Worker 後端通訊，實現新增、讀取、更新和刪除（CRUD）待辦事項的功能。支援多使用者，每個使用者有獨立的待辦事項清單。

App#4: mathgame - 一個限時反應數學遊戲應用程式，連續快速產生數學題目（加減乘除）測試使用者的反應速度和計算能力。可以選擇難度等級（簡單、中等、困難），遊戲在限定時間內進行，挑戰玩家在時間內答對最多題目。使用 Cloudflare KV 儲存遊戲記錄和高分排行榜。介面顯示當前題目、倒數計時器、目前分數和連續答對次數，並在答題後立即顯示正確或錯誤的回饋，答錯時扣分或結束遊戲。

部署與 KV 綁定
----------------

這個專案示範如何使用 asset-directory 提供靜態資源，並在 Worker 中同時提供 API 與 Cloudflare KV 的範例用法。若要在 Cloudflare 上部署並啟用雲端功能，請在 Wrangler 配置中綁定 KV 命名空間。例如在 `wrangler.toml` 或 `wrangler.jsonc` 中新增：

```toml
# 範例（wrangler.toml）
name = "jhm5-ex03"
main = "src/index.ts"
compatibility_date = "2025-09-20"

[kv_namespaces]
bindings = [
	{ binding = "TODOS", id = "<your-todos-namespace-id>" },
	{ binding = "SCORES", id = "<your-scores-namespace-id>" }
]
```

或者在 `wrangler.jsonc` 中加入：

```jsonc
"kv_namespaces": [
	{ "binding": "TODOS", "id": "4c565db994ac47e9b25b034439e5de4f" },
	{ "binding": "SCORES", "id": "070f4f3b0cc34dc4bb83c5b9e23237a3" }
]
```

本機測試
-------

在本機測試 Worker 與靜態頁面：

1. 安裝依賴並啟動 dev 伺服器：

```bash
npm install
npm run dev
```

2. 開啟瀏覽器並前往 http://localhost:8787/ 查看主選單；點選 `Todo (Cloud)` 或 `Math Game` 等會嘗試呼叫後端 API。如果使用 KV 功能，請確保在 Wrangler 中已正確綁定命名空間（並在 Cloudflare 帳號建立命名空間後填入 id）。

注意：本範例的 TypeScript 定義檔 `worker-configuration.d.ts` 是由 `wrangler types` 產生的；若你新增了 KV binding，建議執行 `npm run cf-typegen` 來更新類型定義。

排行榜（Leaderboard）說明
-------------------------

Math Game 的排行榜會優先嘗試使用 Cloudflare KV（命名空間 `SCORES`），並提供以下 API：

- GET /api/leaderboard  — 取得排行榜（JSON 陣列，依分數降冪排序）
- POST /api/leaderboard — 新增一筆排行榜紀錄，body 為 { name, score }

如果未綁定 `SCORES`，Math Game 會自動退回使用 localStorage 儲存排行榜（key: `math.leaderboard`）。在本機測試時可以：

1. 在本機 POST 範例分數：

```bash
curl -X POST http://localhost:8787/api/leaderboard -H 'Content-Type: application/json' -d '{"name":"測試玩家","score":42}'
```

2. 取得排行榜：

```bash
curl http://localhost:8787/api/leaderboard
```

這兩個指令可以用來驗證你的 dev server 是否已經正確綁定 KV 並能夠儲存/讀取排行榜資料。

重新開始（Restart）按鈕說明
-------------------------

在 Math Game 的遊戲結束畫面會顯示「重新開始」按鈕（Restart），點擊後會重置遊戲狀態並重新開始倒數計時。要測試此功能：

1. 於遊戲中答題直到遊戲結束（時間到或按下結束）。
2. 當看到結果與分數時，點選「重新開始」按鈕，畫面上的分數與倒數計時器應該會重置並立即開始新的回合。
3. 若你想驗證排行榜行為是否將分數送至伺服器（KV），可在遊戲結束後觀察瀏覽器是否有向 /api/leaderboard 發送 POST 請求，或使用之前的 curl 範例確認 KV 中是否出現新紀錄。

注意：若你的開發環境未綁定 `SCORES` 命名空間，遊戲會在本機透過 localStorage（key: `math.leaderboard`）保存排行榜資料；在此情況下重新開始不會影響 server-side 的資料。

