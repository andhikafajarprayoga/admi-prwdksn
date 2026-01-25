// DOM Elements
const form = document.getElementById('form-artikel');
const notif = document.getElementById('notif');
const visualEditor = document.getElementById('visual-editor');
const hiddenTextarea = document.getElementById('isi_artikel');
const toolbarBtns = document.querySelectorAll('.toolbar-btn');

// Tags management
const tagsInput = document.getElementById('tags-input');
const tagsHidden = document.getElementById('tags');
const tagsContainer = document.getElementById('tags-input-container');
let tagsArr = [];

// Foto management
let fotoArr = []; // Array foto lama (URL atau nama file)
let fotoToDelete = []; // Foto yang akan dihapus

// Get artikel ID dari URL
const artikelId = getQueryParam('id');

// Load artikel saat halaman dibuka
async function loadArtikel() {
    if (!artikelId) {
        notif.textContent = 'ID artikel tidak ditemukan';
        notif.style.color = 'red';
        return;
    }

    try {
        // Ganti ke URL absolut jika backend beda domain
        const res = await fetch(`https://purwadaksina.space/api/artikel/${artikelId}`);
        if (!res.ok) throw new Error('Artikel tidak ditemukan');
        const artikel = await res.json();

        if (!artikel || Object.keys(artikel).length === 0) {
            throw new Error('Artikel tidak ditemukan');
        }

        fillFormWithData(artikel);
    } catch (error) {
        notif.textContent = 'Gagal memuat data artikel: ' + error.message;
        notif.style.color = 'red';
    }
}

// Isi form dengan data artikel
function fillFormWithData(artikel) {
    // Field-field basic
    document.getElementById('judul').value = artikel.judul || '';
    document.getElementById('slug').value = artikel.slug || '';
    document.getElementById('tanggal').value = artikel.tanggal ? artikel.tanggal.substr(0, 10) : '';
    document.getElementById('penulis').value = artikel.penulis || '';
    document.getElementById('kategori').value = artikel.kategori || '';
    document.getElementById('status').value = artikel.status || 'publish';
    document.getElementById('meta_title').value = artikel.meta_title || '';
    document.getElementById('meta_description').value = artikel.meta_description || '';
    document.getElementById('meta_keywords').value = artikel.meta_keywords || '';
    // Tambah: isi kolom highlight jika ada
    if (document.getElementById('highlight')) {
        document.getElementById('highlight').value = artikel.highlight !== undefined ? String(artikel.highlight) : '0';
    }

    // Debug data artikel yang diterima
    console.log('Data artikel:', artikel);
    console.log('artikel.foto raw:', artikel.foto);
    console.log('typeof artikel.foto:', typeof artikel.foto);

    // Load tags
    if (artikel.tags) {
        tagsArr = artikel.tags.split(',').map(t => t.trim()).filter(t => t);
        renderTags();
    }

    // Load konten ke visual editor
    if (artikel.isi_artikel && artikel.isi_artikel.konten) {
        visualEditor.innerHTML = jsonToHtml(artikel.isi_artikel.konten);
        updateHiddenTextarea();
    }

    // Foto lama - BERSIHKAN DARI AWAL
    fotoArr = [];
    if (artikel.foto) {
        if (Array.isArray(artikel.foto)) {
            // Bersihkan setiap URL foto dari duplikasi domain
            fotoArr = artikel.foto.map(cleanFotoUrl);
            window.lastBackendFotoArr = fotoArr.slice();
            console.log('Foto is array (cleaned):', fotoArr);
        } else if (typeof artikel.foto === 'string') {
            const fotoStr = artikel.foto.trim();
            console.log('Foto string trimmed:', fotoStr);
            
            if (fotoStr.startsWith('[') && fotoStr.endsWith(']')) {
                try {
                    const parsed = JSON.parse(fotoStr);
                    console.log('Parsed JSON:', parsed);
                    if (Array.isArray(parsed)) {
                        // Bersihkan setiap URL foto
                        fotoArr = parsed.map(cleanFotoUrl);
                        window.lastBackendFotoArr = fotoArr.slice();
                        console.log('Successfully parsed as array (cleaned):', fotoArr);
                    } else {
                        fotoArr = [cleanFotoUrl(artikel.foto)];
                        window.lastBackendFotoArr = fotoArr.slice();
                        console.log('Parsed but not array, using original (cleaned):', fotoArr);
                    }
                } catch (error) {
                    console.error('JSON parse error:', error);
                    fotoArr = [cleanFotoUrl(artikel.foto)];
                    window.lastBackendFotoArr = fotoArr.slice();
                }
            } else {
                if (fotoStr) {
                    fotoArr = [cleanFotoUrl(artikel.foto)];
                    window.lastBackendFotoArr = fotoArr.slice();
                    console.log('Plain string, wrapped in array (cleaned):', fotoArr);
                }
            }
        }
    }
    
    // RESET fotoToDelete
    fotoToDelete = [];
    
    console.log('Final fotoArr before renderFotoPreview:', fotoArr);
    renderFotoPreview();
    
    console.log('Foto array:', fotoArr); // Debug
}

// Update hidden textarea dengan JSON
function updateHiddenTextarea() {
    const konten = convertToJSON(visualEditor);
    hiddenTextarea.value = JSON.stringify({ "konten": konten });
}

// Setup toolbar buttons
setupToolbar(toolbarBtns, visualEditor, updateHiddenTextarea);

// Visual editor event listeners
visualEditor.addEventListener('input', updateHiddenTextarea);
visualEditor.addEventListener('blur', updateHiddenTextarea);

// Tags input handler
tagsInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        e.preventDefault();
        const val = this.value.trim();
        if (val && !tagsArr.includes(val)) {
            tagsArr.push(val);
            renderTags();
        }
        this.value = '';
    } else if (e.key === 'Backspace' && this.value === '' && tagsArr.length > 0) {
        tagsArr.pop();
        renderTags();
    }
});

// Render tags badges
function renderTags() {
    tagsContainer.querySelectorAll('.tag-badge').forEach(el => el.remove());
    tagsArr.forEach((tag, idx) => {
        const span = document.createElement('span');
        span.className = 'tag-badge';
        span.textContent = tag;
        
        const close = document.createElement('span');
        close.className = 'tag-remove';
        close.textContent = '×';
        close.onclick = () => {
            tagsArr.splice(idx, 1);
            renderTags();
        };
        
        span.appendChild(close);
        tagsContainer.insertBefore(span, tagsInput);
    });
    tagsHidden.value = tagsArr.join(',');
}

// Render foto preview dan hapus
function renderFotoPreview() {
    console.log('renderFotoPreview called with fotoArr:', fotoArr);
    console.log('fotoToDelete current state:', fotoToDelete);
    
    const container = document.getElementById('foto-preview-container');
    if (!container) {
        console.error('foto-preview-container element not found!');
        return;
    }
    
    console.log('Container found:', container);
    container.innerHTML = '';
    
    if (fotoArr.length === 0) {
        container.innerHTML = '<p style="color:#666; font-style:italic; margin:0;">Belum ada foto yang diupload</p>';
        console.log('No photos to display');
        return;
    }
    
    console.log(`Rendering ${fotoArr.length} photos`);
    
    fotoArr.forEach((foto, idx) => {
        console.log(`Processing photo ${idx}:`, foto);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'foto-preview-item';

        const img = document.createElement('img');
        
        // Untuk display, tambahkan domain hanya jika belum ada
        let imageUrl = '';
        if (typeof foto === 'string') {
            const cleanFoto = foto.trim();
            
            if (cleanFoto.startsWith('http://') || cleanFoto.startsWith('https://')) {
                imageUrl = cleanFoto;
            } else {
                // Hanya nama file, tambahkan domain
                imageUrl = `https://purwadaksina.space/uploads/${cleanFoto}`;
            }
        } else {
            imageUrl = 'https://via.placeholder.com/90x90?text=Invalid+Image';
        }
        
        img.src = imageUrl;
        img.alt = 'Foto artikel';
        img.style.maxWidth = '90px';
        img.style.maxHeight = '90px';
        img.style.borderRadius = '6px';
        img.style.border = '1px solid #ddd';
        img.style.objectFit = 'cover';
        
        img.onload = function() {
            console.log(`Image loaded successfully: ${imageUrl}`);
        };
        
        img.onerror = function() {
            console.error(`Failed to load image: ${imageUrl}`);
            this.src = 'https://via.placeholder.com/90x90?text=Error';
            this.style.opacity = '0.5';
        };

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.title = 'Hapus foto ini';
        delBtn.className = 'foto-delete-btn';
        delBtn.onclick = () => {
            if (!fotoToDelete.includes(foto)) {
                fotoToDelete.push(foto); // Foto yang akan dihapus
            }
            fotoArr = fotoArr.filter(f => f !== foto); // Hapus dari tampilan
            renderFotoPreview();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
        
        console.log(`Photo ${idx} rendered successfully`);
    });
    
    console.log('All photos rendered');
}

// Helper untuk membersihkan foto URL yang berlipat ganda
function cleanFotoUrl(foto) {
    if (typeof foto !== 'string') return foto;
    
    let cleanFoto = foto.trim();
    
    // Ekstrak nama file dari URL yang berlipat ganda
    const fileNameMatch = cleanFoto.match(/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (fileNameMatch) {
        return fileNameMatch[1]; // Hanya nama file
    }
    
    // Fallback: coba ekstrak dari pattern /uploads/ terakhir
    const uploadsMatch = cleanFoto.match(/\/uploads\/([^\/]+)$/);
    if (uploadsMatch) {
        return uploadsMatch[1];
    }
    
    return cleanFoto;
}

// Load kategori dari API
async function loadKategori() {
    try {
        const res = await fetch('/api/artikel');
        const data = await res.json();
        const kategoriSet = new Set();
        
        data.forEach(artikel => {
            if (artikel.kategori && artikel.kategori.trim()) {
                kategoriSet.add(artikel.kategori.trim());
            }
        });
        
        const kategoriList = document.getElementById('kategori-list');
        kategoriList.innerHTML = '';
        Array.from(kategoriSet).sort().forEach(kat => {
            const opt = document.createElement('option');
            opt.value = kat;
            kategoriList.appendChild(opt);
        });
    } catch (e) {
        console.error('Gagal load kategori:', e);
    }
}

// Handle form submit
form.onsubmit = async function(e) {
    e.preventDefault();
    notif.textContent = '';
    notif.style.color = '';

    showLoading();

    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('fotoArr before submit:', fotoArr);
    console.log('fotoToDelete before submit:', fotoToDelete);

    const formData = new FormData();
    formData.append('judul', document.getElementById('judul').value);
    formData.append('slug', document.getElementById('slug').value);
    formData.append('tanggal', document.getElementById('tanggal').value);
    formData.append('penulis', document.getElementById('penulis').value);
    formData.append('kategori', document.getElementById('kategori').value);
    formData.append('status', document.getElementById('status').value);
    formData.append('tags', document.getElementById('tags').value);
    formData.append('meta_title', document.getElementById('meta_title').value);
    formData.append('meta_description', document.getElementById('meta_description').value);
    formData.append('meta_keywords', document.getElementById('meta_keywords').value);
    if (document.getElementById('highlight')) {
        formData.append('highlight', document.getElementById('highlight').value);
    }

    // Kirim foto lama yang masih ada (sudah bersih, hanya nama file)
    // PATCH: Jangan kirim fotoLama kosong jika user menghapus satu foto
    let fotoLamaFiltered = Array.from(new Set(fotoArr.filter(Boolean)));
    const fotoInput = document.getElementById('foto');
    const isFotoChanged = fotoToDelete.length > 0 || (fotoInput && fotoInput.files.length > 0);

    // --- PATCH START ---
    // Jika user menghapus foto, pastikan fotoLamaFiltered berisi semua foto yang masih ada di preview (fotoArr)
    // Jangan gunakan window.lastBackendFotoArr jika fotoArr sudah ada isinya
    if (!isFotoChanged && (!fotoLamaFiltered || fotoLamaFiltered.length === 0)) {
        if (window.lastBackendFotoArr && Array.isArray(window.lastBackendFotoArr)) {
            fotoLamaFiltered = window.lastBackendFotoArr.slice();
        }
    }
    // --- PATCH END ---

    formData.append('fotoLama', JSON.stringify(fotoLamaFiltered));
    // Kirim foto yang ingin dihapus (sudah bersih, hanya nama file)
    const fotoToDeleteUnique = Array.from(new Set(fotoToDelete));
    console.log('fotoToDelete to send:', fotoToDeleteUnique);
    formData.append('fotoToDelete', JSON.stringify(fotoToDeleteUnique));

    // Tambahkan file foto baru
    const newFiles = [];
    for (let i = 0; i < fotoInput.files.length; i++) {
        formData.append('foto', fotoInput.files[i]);
        newFiles.push(fotoInput.files[i].name);
    }

    formData.append('isi_artikel', hiddenTextarea.value);

    try {
        const res = await fetch(`https://purwadaksina.space/api/artikel/${artikelId}`, {
            method: 'PUT',
            body: formData
        });
        if (!res.ok) throw new Error('Gagal update artikel');
        
        const result = await res.json();
        console.log('Update result:', result);

        showNotification('Artikel berhasil diupdate!', 'success');

        // PATCH: Simpan fotoArr backend terakhir ke window agar bisa dipakai jika user tidak edit foto
        if (result.foto && Array.isArray(result.foto)) {
            fotoArr = result.foto.map(cleanFotoUrl);
            window.lastBackendFotoArr = fotoArr.slice();
            fotoToDelete = [];
            fotoInput.value = '';
            renderFotoPreview();
        }
        setTimeout(() => {
            hideLoading();
            window.location.href = 'dashboard.html';
        }, 1200);

    } catch (error) {
        hideLoading();
        console.error('Submit error:', error);
        showNotification('Gagal update artikel: ' + error.message, 'error');
    }
};

// Initialize - Load data saat halaman dibuka
loadArtikel();
loadKategori();

// Tambahkan fungsi untuk menampilkan dan menyembunyikan loading
function showLoading() {
    let loading = document.getElementById('loading-overlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.style.position = 'fixed';
        loading.style.top = 0;
        loading.style.left = 0;
        loading.style.width = '100vw';
        loading.style.height = '100vh';
        loading.style.background = 'rgba(255,255,255,0.7)';
        loading.style.display = 'flex';
        loading.style.alignItems = 'center';
        loading.style.justifyContent = 'center';
        loading.style.zIndex = 9999;
        loading.innerHTML = `<div style="font-size:2rem;display:flex;flex-direction:column;align-items:center;">
            <div class="spinner" style="border:6px solid #eee;border-top:6px solid #3498db;border-radius:50%;width:48px;height:48px;animation:spin 1s linear infinite;"></div>
            <div style="margin-top:12px;">Menyimpan...</div>
        </div>
        <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
        </style>`;
        document.body.appendChild(loading);
    } else {
        loading.style.display = 'flex';
    }
}
function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}
