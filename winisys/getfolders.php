<?php
$dir = '/'; // Ganti dengan direktori yang sesuai
$folders = [];

if ($handle = opendir($dir)) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != ".." && is_dir($dir . '/' . $entry)) {
            $folders[] = $entry;
        }
    }
    closedir($handle);
}

header('Content-Type: application/json'); // Set header untuk JSON
echo json_encode($folders); // Mengembalikan data dalam format JSON
?>
