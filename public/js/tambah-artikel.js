document.getElementById('form-artikel').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const notif = document.getElementById('notif');
    const loading = document.getElementById('loading-indicator');
    const submitBtn = document.getElementById('btn-tambah-artikel');
    
    notif.innerHTML = '';
    loading.style.display = 'block';
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('judul', form.judul.value);
    formData.append('slug', form.slug.value);
    formData.append('isi_artikel', form.isi_artikel.value);
    formData.append('tanggal', form.tanggal.value);
    formData.append('penulis', form.penulis.value);
    formData.append('kategori', form.kategori.value);
    formData.append('status', form.status.value);
    formData.append('tags', form.tags.value);
    formData.append('meta_title', form.meta_title.value);
    formData.append('meta_description', form.meta_description.value);
    formData.append('meta_keywords', form.meta_keywords.value);
    formData.append('highlight', form.highlight.value); // <-- Tambahkan ini

    // Kirim semua file dari array fotoFiles
    for (let i = 0; i < fotoFiles.length; i++) {
        formData.append('foto', fotoFiles[i]);
    }

    try {
        const res = await fetch('/api/artikel', {
            method: 'POST',
            body: formData
        });
        loading.style.display = 'none';
        submitBtn.disabled = false;
        if (res.ok) {
            notif.innerHTML = '<span style="color:green;">✅ Artikel berhasil ditambahkan!</span>';
            setTimeout(() => window.location.href = 'dashboard.html', 1200);
        } else {
            notif.innerHTML = '<span style="color:red;">❌ Gagal menambah artikel.</span>';
        }
    } catch (err) {
        loading.style.display = 'none';
        submitBtn.disabled = false;
        notif.innerHTML = '<span style="color:red;">❌ Terjadi error.</span>';
    }
});

const fotoInput = document.getElementById('foto');
const fotoPreviewContainer = document.getElementById('foto-preview-container');
let fotoFiles = []; // Array of File objects

// Preview foto saat dipilih
fotoInput.addEventListener('change', function() {
    // Tambah file baru ke array (tanpa duplikat)
    for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        const isDuplicate = fotoFiles.some(f => f.name === file.name && f.size === file.size);
        if (!isDuplicate) {
            fotoFiles.push(file);
        }
    }
    renderFotoPreview();
    // Reset input agar bisa upload file yang sama lagi jika dihapus
    this.value = '';
});

function renderFotoPreview() {
    fotoPreviewContainer.innerHTML = '';
    fotoFiles.forEach((file, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'foto-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Preview';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.className = 'foto-delete-btn';
        delBtn.title = 'Hapus foto ini';
        delBtn.onclick = () => {
            URL.revokeObjectURL(img.src); // Bebaskan memori
            fotoFiles.splice(idx, 1);
            renderFotoPreview();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        fotoPreviewContainer.appendChild(wrapper);
    });
}
