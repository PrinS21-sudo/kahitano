CREATE DATABASE IF NOT EXISTS howard
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE howard;

CREATE TABLE IF NOT EXISTS leaderboard_scores (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nickname VARCHAR(16) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    score INT UNSIGNED NOT NULL DEFAULT 0,
    streak INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_player_difficulty (nickname, difficulty),
    KEY leaderboard_sort (difficulty, score, streak)
);

CREATE TABLE IF NOT EXISTS food_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_token CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_food_order_token (public_token)
);

CREATE TABLE IF NOT EXISTS food_order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    food_order_id BIGINT UNSIGNED NOT NULL,
    food_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    quantity SMALLINT UNSIGNED NOT NULL,
    price_cents INT UNSIGNED NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_order_food (food_order_id, food_key),
    CONSTRAINT food_order_items_order_fk
        FOREIGN KEY (food_order_id) REFERENCES food_orders (id)
        ON DELETE CASCADE
);