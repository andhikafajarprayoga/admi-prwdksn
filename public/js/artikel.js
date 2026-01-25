// Ambil paragraf pertama dari konten
function getFirstParagraph(konten) {
    for (const item of konten) {
        if (item.tipe === 'paragraf') {
            // Ambil isi dan ringkas maksimal 60 karakter
            const isi = parseMarkup(item.isi);
            const cleanText = isi.replace(/<[^>]*>/g, ''); // Hapus HTML tags untuk preview
            return cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText;
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
async function tampilkanArtikel(selector = '#artikel-list', page = 1) {
    const res = await fetch('/api/artikel');
    const data = await res.json();
    const container = document.querySelector(selector);

    const perPage = 10;
    const total = data.length;
    const totalPages = Math.ceil(total / perPage);
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;
    const pageData = data.slice(startIdx, endIdx);

    // Header dengan total artikel dan tombol tambah
    const headerHTML = `
        <div class="artikel-header">
            <div class="header-info">
                <p class="total-count">Total ${total} article</p>
            </div>
            <a href="tambah-artikel.html" class="btn-tambah-artikel">
                ➕ Tambah Article
            </a>
        </div>
    `;

    const tableHTML = `
        <table class="artikel-table-modern">    
            <thead>
                <tr>
                    <th style="width: 50px; color: #111;">#</th>
                    <th style="width: 150px; color: #111;">TANGGAL PUBLISH</th>
                    <th style="width: 300px; color: #111;">TITLE</th>
                    <th style="width: 120px; color: #111;">KATEGORI</th>
                    <th style="width: auto; color: #111;">TAGS</th>
                    <th style="width: 120px; color: #111;">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                ${pageData.map((artikel, idx) => `
                    <tr>
                        <td style="text-align: center; color: #999;">${startIdx + idx + 1}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: #999;">📅</span>
                                <span>${new Date(artikel.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                            </div>
                        </td>
                        <td><strong style="color: #2c3e50;">${artikel.judul}</strong></td>
                        <td>
                            <span class="badge badge-${artikel.kategori.toLowerCase()}">${artikel.kategori.toUpperCase()}</span>
                        </td>
                        <td>
                            <div class="tags-container">
                                ${artikel.tags ? artikel.tags.split(',').map(tag => 
                                    `<span class="tag">${tag.trim()}</span>`
                                ).join('') : '-'}
                            </div>
                        </td>
                        <td>
                            <div class="action-buttons">                        
                                <button class="btn-action btn-edit" title="Edit" data-id="${artikel.id}">✏️</button>
                                <button class="btn-action btn-delete" title="Delete" data-id="${artikel.id}">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Pagination controls
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML = `<div class="pagination">`;
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="pagination-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHTML += `</div>`;
    }

    container.innerHTML = headerHTML + tableHTML + paginationHTML;

    // Event handlers
    container.querySelectorAll('.btn-view').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            window.open(`/artikel/${id}`, '_blank');
        };
    });

    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            window.location.href = `edit-artikel.html?id=${id}`;
        };
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            showDeleteArtikelModal(id, () => tampilkanArtikel(selector, page));
        };
    });

    // Pagination event
    container.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.onclick = function() {
            const goto = parseInt(this.getAttribute('data-page'));
            tampilkanArtikel(selector, goto);
        };
    });
}
