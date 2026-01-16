/**
 * Tampilkan modal konfirmasi hapus artikel.
 * @param {string|number} id - ID artikel yang akan dihapus.
 * @param {function} onSuccess - Callback jika berhasil hapus.
 */
function showDeleteArtikelModal(id, onSuccess) {
    // Hapus modal lama jika ada
    const oldModal = document.getElementById('modal-delete-artikel');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-delete-artikel';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h3>Konfirmasi Hapus</h3>
            <p>Yakin ingin menghapus artikel ini?<br><small>ID: <b>${id}</b></small></p>
            <div class="modal-actions">
                <button class="btn-modal-cancel">Batal</button>
                <button class="btn-modal-delete">Hapus</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.btn-modal-cancel').onclick = () => modal.remove();
    modal.querySelector('.modal-overlay').onclick = () => modal.remove();
    modal.querySelector('.btn-modal-delete').onclick = async () => {
        modal.remove();
        try {
            const res = await fetch(`/api/artikel/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal hapus');
            if (typeof onSuccess === 'function') onSuccess();
        } catch (err) {
            alert('Gagal menghapus artikel!');
        }
    };
}

// Cara pakai di file lain:
// showDeleteArtikelModal(id, () => { tampilkanArtikel(); });
