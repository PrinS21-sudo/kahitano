<?php

header('Content-Type: application/json; charset=utf-8');

function respond($payload, $status = 200)
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function getMenuCatalog()
{
    return [
        'burger' => ['name' => 'Burger', 'price' => 5000],
        'spaghetti' => ['name' => 'Spaghetti', 'price' => 7000],
        'chicken' => ['name' => 'Fried Chicken', 'price' => 8000],
        'pizza' => ['name' => 'Pizza', 'price' => 50000],
        'grilled-chicken-caesar-salad' => ['name' => 'Grilled Chicken Caesar Salad', 'price' => 75342],
        'classic-club-sandwich' => ['name' => 'Classic Club Sandwich', 'price' => 63742],
        'spinach-feta-stuffed-chicken' => ['name' => 'Spinach and Feta Stuffed Chicken', 'price' => 86942],
        'vegetable-quinoa-bowl' => ['name' => 'Vegetable Quinoa Bowl', 'price' => 69542],
        'bbq-pulled-pork-sandwich' => ['name' => 'BBQ Pulled Pork Sandwich', 'price' => 57942],
        'caprese-panini' => ['name' => 'Caprese Panini', 'price' => 52142],
        'fish-tacos' => ['name' => 'Fish Tacos', 'price' => 81142],
        'mushroom-swiss-burger' => ['name' => 'Mushroom and Swiss Burger', 'price' => 75342],
        'quiche-lorraine' => ['name' => 'Quiche Lorraine', 'price' => 63742],
        'mediterranean-pasta' => ['name' => 'Mediterranean Pasta', 'price' => 81142],
        'asian-chicken-salad' => ['name' => 'Asian Chicken Salad', 'price' => 69542],
        'beef-stir-fry' => ['name' => 'Beef Stir-Fry', 'price' => 92742],
        'margherita-pizza' => ['name' => 'Margherita Pizza', 'price' => 86942],
        'roasted-vegetable-wrap' => ['name' => 'Roasted Vegetable Wrap', 'price' => 57942],
        'soup-of-the-day' => ['name' => 'Soup of the Day', 'price' => 34742],
        'soft-drinks' => ['name' => 'Soft Drinks', 'price' => 17342],
        'iced-tea' => ['name' => 'Iced Tea', 'price' => 17342],
        'fresh-lemonade' => ['name' => 'Freshly Squeezed Lemonade', 'price' => 23142],
        'fruit-smoothies' => ['name' => 'Fruit Smoothies', 'price' => 28942],
        'coffee' => ['name' => 'Coffee', 'price' => 17342],
        'hot-tea' => ['name' => 'Hot Tea', 'price' => 17342],
        'bottled-water' => ['name' => 'Bottled Water', 'price' => 11542]
    ];
}

function getOrderSnapshot(PDO $connection, $orderId)
{
    $query = $connection->prepare(
        'SELECT id, food_key, quantity, price_cents
         FROM food_order_items
         WHERE food_order_id = :order_id
         ORDER BY id ASC'
    );
    $query->execute(['order_id' => $orderId]);

    $menu = getMenuCatalog();
    $items = [];
    $total = 0;

    foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $price = (int)$row['price_cents'];
        $quantity = (int)$row['quantity'];
        $subtotal = $price * $quantity;
        $total += $subtotal;
        $items[] = [
            'id' => (int)$row['id'],
            'food' => $row['food_key'],
            'name' => $menu[$row['food_key']]['name'],
            'price' => $price,
            'quantity' => $quantity,
            'subtotal' => $subtotal
        ];
    }

    return ['items' => $items, 'total' => $total];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    respond(['error' => 'Invalid request body'], 400);
}

$token = (string)($payload['token'] ?? '');
$action = (string)($payload['action'] ?? '');
if (!preg_match('/\A[a-f0-9]{64}\z/i', $token)) {
    respond(['error' => 'Invalid order token'], 400);
}

$menu = getMenuCatalog();

$host = getenv('COLOR_GAME_DB_HOST') ?: '127.0.0.1';
$port = getenv('COLOR_GAME_DB_PORT') ?: '3306';
$database = getenv('COLOR_GAME_DB_NAME') ?: 'howard';
$username = getenv('COLOR_GAME_DB_USER') ?: 'root';
$password = getenv('COLOR_GAME_DB_PASSWORD') ?: '';

try {
    $connection = new PDO(
        "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $connection->beginTransaction();
    $createOrder = $connection->prepare(
        'INSERT INTO food_orders (public_token) VALUES (:token)
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)'
    );
    $createOrder->execute(['token' => $token]);
    $orderId = (int)$connection->lastInsertId();

    if ($action === 'add') {
        $food = (string)($payload['food'] ?? '');
        $quantity = filter_var($payload['quantity'] ?? null, FILTER_VALIDATE_INT);
        if (!isset($menu[$food]) || $quantity === false || $quantity < 1 || $quantity > 100) {
            $connection->rollBack();
            respond(['error' => 'Choose a menu item and a quantity from 1 to 100.'], 400);
        }

        $findItem = $connection->prepare(
            'SELECT id, quantity FROM food_order_items
             WHERE food_order_id = :order_id AND food_key = :food FOR UPDATE'
        );
        $findItem->execute(['order_id' => $orderId, 'food' => $food]);
        $existing = $findItem->fetch();
        if ($existing && (int)$existing['quantity'] + $quantity > 100) {
            $connection->rollBack();
            respond(['error' => 'A menu item cannot exceed 100 in one order.'], 400);
        }

        if ($existing) {
            $updateItem = $connection->prepare(
                'UPDATE food_order_items SET quantity = quantity + :quantity, price_cents = :price
                 WHERE id = :id AND food_order_id = :order_id'
            );
            $updateItem->execute([
                'quantity' => $quantity,
                'price' => $menu[$food]['price'],
                'id' => $existing['id'],
                'order_id' => $orderId
            ]);
        } else {
            $insertItem = $connection->prepare(
                'INSERT INTO food_order_items (food_order_id, food_key, quantity, price_cents)
                 VALUES (:order_id, :food, :quantity, :price)'
            );
            $insertItem->execute([
                'order_id' => $orderId,
                'food' => $food,
                'quantity' => $quantity,
                'price' => $menu[$food]['price']
            ]);
        }
    } elseif ($action === 'update') {
        $itemId = filter_var($payload['item_id'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($payload['quantity'] ?? null, FILTER_VALIDATE_INT);
        if ($itemId === false || $itemId < 1 || $quantity === false || $quantity < 1 || $quantity > 100) {
            $connection->rollBack();
            respond(['error' => 'Enter a quantity from 1 to 100.'], 400);
        }

        $updateItem = $connection->prepare(
            'UPDATE food_order_items SET quantity = :quantity
             WHERE id = :id AND food_order_id = :order_id'
        );
        $updateItem->execute([
            'quantity' => $quantity,
            'id' => $itemId,
            'order_id' => $orderId
        ]);
    } elseif ($action === 'remove') {
        $itemId = filter_var($payload['item_id'] ?? null, FILTER_VALIDATE_INT);
        if ($itemId === false || $itemId < 1) {
            $connection->rollBack();
            respond(['error' => 'Invalid order item'], 400);
        }

        $removeItem = $connection->prepare(
            'DELETE FROM food_order_items WHERE id = :id AND food_order_id = :order_id'
        );
        $removeItem->execute(['id' => $itemId, 'order_id' => $orderId]);
    } elseif ($action === 'clear') {
        $clearItems = $connection->prepare(
            'DELETE FROM food_order_items WHERE food_order_id = :order_id'
        );
        $clearItems->execute(['order_id' => $orderId]);
    } elseif ($action !== 'load') {
        $connection->rollBack();
        respond(['error' => 'Unknown order action'], 400);
    }

    $order = getOrderSnapshot($connection, $orderId);
    $connection->commit();
    respond(['success' => true, 'order' => $order]);
} catch (PDOException $error) {
    if (isset($connection) && $connection->inTransaction()) {
        $connection->rollBack();
    }
    respond(['error' => 'Could not save the order. Check the database connection and schema.'], 500);
}