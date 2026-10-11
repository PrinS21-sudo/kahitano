<?php

header('Content-Type: application/json; charset=utf-8');

$host = getenv('COLOR_GAME_DB_HOST') ?: '127.0.0.1';
$port = getenv('COLOR_GAME_DB_PORT') ?: '3306';
$database = getenv('COLOR_GAME_DB_NAME') ?: 'howard';
$username = getenv('COLOR_GAME_DB_USER') ?: 'root';
$password = getenv('COLOR_GAME_DB_PASSWORD') ?: '';

$allowedDifficulties = ['easy', 'medium', 'hard'];
$difficulty = $_GET['difficulty'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!in_array($difficulty, $allowedDifficulties, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid difficulty']);
        exit;
    }

    try {
        $databaseConnection = new PDO(
            "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4",
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $query = $databaseConnection->prepare(
            'SELECT nickname, score, streak FROM leaderboard_scores
             WHERE difficulty = :difficulty
             ORDER BY score DESC, streak DESC, updated_at ASC
             LIMIT 5'
        );
        $query->execute(['difficulty' => $difficulty]);
        echo json_encode($query->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true) ?: [];
$nickname = trim((string)($payload['nickname'] ?? ''));
$difficulty = $payload['difficulty'] ?? '';
$score = filter_var($payload['score'] ?? null, FILTER_VALIDATE_INT);
$streak = filter_var($payload['streak'] ?? null, FILTER_VALIDATE_INT);

if ($nickname === '' || strlen($nickname) > 16 || !in_array($difficulty, $allowedDifficulties, true)
    || $score === false || $score < 0 || $streak === false || $streak < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid score data']);
    exit;
}

try {
    $databaseConnection = new PDO(
        "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $query = $databaseConnection->prepare(
        'INSERT INTO leaderboard_scores (nickname, difficulty, score, streak)
         VALUES (:nickname, :difficulty, :score, :streak)
         ON DUPLICATE KEY UPDATE
             score = GREATEST(score, VALUES(score)),
             streak = IF(VALUES(score) > score, VALUES(streak), GREATEST(streak, VALUES(streak)))'
    );
    $query->execute([
        'nickname' => $nickname,
        'difficulty' => $difficulty,
        'score' => $score,
        'streak' => $streak
    ]);
    echo json_encode(['success' => true]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
}