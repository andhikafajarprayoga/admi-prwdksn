document.getElementById('form-artikel').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const notif = document.getElementById('notif');

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

    // Tambahkan semua file foto ke FormData
    const files = form.foto.files;
    for (let i = 0; i < files.length; i++) {
        formData.append('foto', files[i]);
    }

    try {
        const res = await fetch('/api/artikel', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            notif.innerHTML = '<span style="color:green;">Artikel berhasil ditambahkan!</span>';
            setTimeout(() => window.location.href = 'dashboard.html', 1200);
        } else {
            notif.innerHTML = '<span style="color:red;">Gagal menambah artikel.</span>';
        }
    } catch (err) {
        notif.innerHTML = '<span style="color:red;">Terjadi error.</span>';
    }
});
