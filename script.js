const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle file upload and conversion
app.post('/convert', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const audioBuffer = req.file.buffer;

    // Convert WAV to MP3 using FFmpeg
    const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',         // Input from pipe
        '-f', 'mp3',            // Output format
        'pipe:1'                // Output to pipe
    ]);

    ffmpeg.on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'FFmpeg error' });
    });

    ffmpeg.on('exit', (code) => {
        if (code === 0) {
            res.set('Content-Type', 'audio/mp3');
            res.set('Content-Disposition', 'attachment; filename="converted.mp3"');
            res.send(ffmpeg.stdout);
        } else {
            res.status(500).json({ error: 'Conversion error' });
        }
    });

    ffmpeg.stdin.write(audioBuffer);
    ffmpeg.stdin.end();
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
