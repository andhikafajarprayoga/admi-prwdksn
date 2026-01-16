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

    // Foto lama (array atau string, tergantung backend)
    fotoArr = [];
    if (Array.isArray(artikel.foto)) {
        fotoArr = artikel.foto;
    } else if (typeof artikel.foto === 'string' && artikel.foto) {
        fotoArr = [artikel.foto];
    }
    fotoToDelete = [];
    renderFotoPreview();
}

// Update hidden textarea dengan JSON
function updateHiddenTextarea() {
    const jsonData = convertToJSON(visualEditor);
    hiddenTextarea.value = JSON.stringify(jsonData);
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
    const container = document.getElementById('foto-preview-container');
    container.innerHTML = '';
    fotoArr.forEach((foto, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'foto-preview-item';
        wrapper.style.display = 'inline-block';
        wrapper.style.marginRight = '10px';
        wrapper.style.position = 'relative';

        const img = document.createElement('img');
        // Cek apakah foto sudah URL absolut atau hanya nama file
        img.src = (foto.startsWith('http://') || foto.startsWith('https://')) ? foto : `/uploads/${foto}`;
        img.alt = 'Foto artikel';
        img.style.maxWidth = '90px';
        img.style.maxHeight = '90px';
        img.style.borderRadius = '6px';
        img.style.border = '1px solid #ddd';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.title = 'Hapus foto ini';
        delBtn.className = 'foto-delete-btn';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '2px';
        delBtn.style.right = '2px';
        delBtn.style.background = '#e74c3c';
        delBtn.style.color = '#fff';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '50%';
        delBtn.style.width = '22px';
        delBtn.style.height = '22px';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = () => {
            fotoToDelete.push(foto);
            fotoArr.splice(idx, 1);
            renderFotoPreview();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
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
    // Tambah: highlight
    if (document.getElementById('highlight')) {
        formData.append('highlight', document.getElementById('highlight').value);
    }

    // Tambahkan info foto yang ingin dihapus
    fotoToDelete.forEach(f => formData.append('fotoToDelete[]', f));

    // Tambahkan file foto baru (jika ada)
    const fotoInput = document.getElementById('foto');
    for (let i = 0; i < fotoInput.files.length; i++) {
        formData.append('foto', fotoInput.files[i]);
    }

    // Validasi JSON isi_artikel
    try {
        formData.append('isi_artikel', hiddenTextarea.value);
    } catch {
        showNotification('Isi artikel harus format JSON yang valid!', 'error');
        return;
    }

    // Submit update (pakai fetch FormData)
    try {
        const res = await fetch(`https://purwadaksina.space/api/artikel/${artikelId}`, {
            method: 'PUT',
            body: formData
        });
        if (!res.ok) throw new Error('Gagal update artikel');
        showNotification('Artikel berhasil diupdate!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (error) {
        showNotification('Gagal update artikel: ' + error.message, 'error');
    }
};

// Initialize - Load data saat halaman dibuka
loadArtikel();
loadKategori();
