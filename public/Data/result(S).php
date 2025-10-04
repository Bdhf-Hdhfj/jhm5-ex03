<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>計算結果</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>計算結果</h1>
        
        <?php
        // 检测请求方法
        $method = $_SERVER['REQUEST_METHOD'];
        echo '<div class="method-info">使用的請求方法: <strong>' . $method . '</strong></div>';
        
        // 根据请求方法获取數据
        if ($method === 'GET') {
            $num1 = isset($_GET['num1']) ? floatval($_GET['num1']) : 0;
            $num2 = isset($_GET['num2']) ? floatval($_GET['num2']) : 0;
            $num3 = isset($_GET['num3']) ? floatval($_GET['num3']) : 0;
            $num4 = isset($_GET['num4']) ? floatval($_GET['num4']) : 0;
        } else if ($method === 'POST') {
            $num1 = isset($_POST['num1']) ? floatval($_POST['num1']) : 0;
            $num2 = isset($_POST['num2']) ? floatval($_POST['num2']) : 0;
            $num3 = isset($_POST['num3']) ? floatval($_POST['num3']) : 0;
            $num4 = isset($_POST['num4']) ? floatval($_POST['num4']) : 0;
        }
        
        // 計算平均值
        $average = ($num1+$num2+$num3+$num4) / 4;
        ?>
        
        <div class="numbers-list">
            <h2>輸入的數字:</h2>
            <div class="number-item">
                <span>數字 1:</span>
                <span><?php echo $num1; ?></span>
            </div>
            <div class="number-item">
                <span>數字 2:</span>
                <span><?php echo $num2; ?></span>
            </div>
            <div class="number-item">
                <span>數字 3:</span>
                <span><?php echo $num3; ?></span>
            </div>
            <div class="number-item">
                <span>數字 4:</span>
                <span><?php echo $num4; ?></span>
            </div>
        </div>
        
        <div class="result-box">
            <h2>平均值</h2>
            <div class="result-value"><?php echo number_format($average, 2); ?></div>
            <p>四個數字的平均值</p>
        </div>
        
        <a href="input_form(S).html" class="back-btn">返回輸入頁面</a>
    </div>
</body>
</html>