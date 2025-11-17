<?php
// Simple router for PHP built-in web server
// Routes all requests to index.php

if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js|ico|svg|woff|woff2|ttf|eot)$/', $_SERVER["REQUEST_URI"])) {
    return false;    // serve the requested resource as-is.
}

require_once __DIR__ . '/index.php';
