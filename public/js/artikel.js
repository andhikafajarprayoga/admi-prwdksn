// Ambil paragraf pertama dari konten
function getFirstParagraph(konten) {
    for (const item of konten) {
        if (item.tipe === 'paragraf') {
            // Ambil isi dan ringkas maksimal 120 karakter
            const isi = parseMarkup(item.isi);
            return isi.length > 120 ? isi.substring(0, 120) + '...' : isi;
        }
    }
    return '';
}

// Fungsi parse markup sederhana (<bold>, <italic>, <underline>, <link>)
function parseMarkup(text) {
    return text
        .replace(/<bold>(.*?)<\/bold>/g, '<b>$1</b>')
        .replace(/<italic>(.*?)<\/italic>/g, '<i>$1</i>')
        .replace(/<underline>(.*?)<\/underline>/g, '<u>$1</u>')
        .replace(/<link href='(.*?)'>(.*?)<\/link>/g, '<a href="$1" target="_blank">$2</a>');
}

// Fungsi utama untuk load dan render artikel
async function tampilkanArtikel(selector = '#artikel-list') {
    const res = await fetch('/api/artikel');
    const data = await res.json();
    const container = document.querySelector(selector);
    container.innerHTML = `
        <table class="artikel-table">    
            <thead>
                <tr>
                    <th>No</th>
                    <th>Judul</th>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Isi Singkat</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((artikel, idx) => `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${artikel.judul}</td>
                        <td>${new Date(artikel.tanggal).toLocaleDateString()}</td>
                        <td>${artikel.kategori}</td>
                        <td>${getFirstParagraph(artikel.isi_artikel.konten)}</td>
                        <td>
                            <button class="btn-edit" title="Edit" data-id="${artikel.id}">
                                ✏️
                            </button>
                            <button class="btn-delete" title="Delete" data-id="${artikel.id}">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Event handler untuk tombol edit dan delete (dummy, bisa diisi sesuai kebutuhan)
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            alert('Edit artikel dengan ID: ' + id);
            // Implementasi edit bisa ditambahkan di sini
        };
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            if (confirm('Yakin ingin menghapus artikel ini?')) {
                alert('Delete artikel dengan ID: ' + id);
                // Implementasi delete bisa ditambahkan di sini
            }
        };
    });
}
