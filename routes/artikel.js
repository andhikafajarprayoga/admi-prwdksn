const express = require('express');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

// GET semua artikel
router.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://purwadaksina.space/api/artikel');
        // Cek struktur respons
        // console.log(response.data);
        // Jika response.data adalah array, langsung kirim
        if (Array.isArray(response.data)) {
            return res.json(response.data);
        }
        // Jika response.data.data adalah array, kirim itu
        if (response.data && Array.isArray(response.data.data)) {
            return res.json(response.data.data);
        }
        // Jika response.data.result adalah array, kirim itu
        if (response.data && Array.isArray(response.data.result)) {
            return res.json(response.data.result);
        }
        // Default: kirim seluruh response.data
        res.json(response.data);
    } catch (error) {
        // Log error agar mudah debug
        console.error('Gagal mengambil data artikel:', error.message);
        res.status(500).json({ error: 'Gagal mengambil data artikel' });
    }
});

// Proxy POST artikel (handle form-data dengan file)
router.post('/', upload.array('foto'), async (req, res) => {
    try {
        const form = new FormData();
        // Field text
        for (const key in req.body) {
            if (key === 'isi_artikel') {
                // Pastikan isi_artikel dikirim sebagai JSON string
                try {
                    // Jika sudah JSON, jangan double-stringify
                    const parsed = JSON.parse(req.body[key]);
                    form.append('isi_artikel', JSON.stringify(parsed));
                } catch {
                    // Jika belum JSON, buat jadi JSON
                    form.append('isi_artikel', JSON.stringify({ konten: [{ tipe: "paragraf", isi: req.body[key] }] }));
                }
            } else {
                form.append(key, req.body[key]);
            }
        }
        // Field file
        if (req.files) {
            req.files.forEach(file => {
                form.append('foto', fs.createReadStream(file.path), file.originalname);
            });
        }
        // Kirim ke API eksternal
        const response = await axios.post('https://purwadaksina.space/api/artikel', form, {
            headers: form.getHeaders()
        });
        // Hapus file upload lokal setelah selesai
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Gagal menambah artikel:', error.message, error.response?.data);
        res.status(500).json({ error: 'Gagal menambah artikel', detail: error.message, response: error.response?.data });
    }
});

module.exports = router;
