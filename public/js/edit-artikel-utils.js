/**
 * Ambil parameter dari URL
 * @param {string} name - Nama parameter
 * @returns {string|null} Nilai parameter
 */
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

/**
 * Load data artikel dari API berdasarkan ID
 * @param {string|number} id - ID artikel
 * @returns {Promise<Object>} Data artikel
 */
async function loadArtikelById(id) {
    if (!id) {
        throw new Error('ID artikel tidak ditemukan');
    }
    
    const res = await fetch(`/api/artikel/${id}`);
    if (!res.ok) {
        throw new Error('Artikel tidak ditemukan');
    }
    
    return await res.json();
}

/**
 * Update artikel ke API
 * @param {string|number} id - ID artikel
 * @param {Object} data - Data artikel yang akan diupdate
 * @returns {Promise<Object>} Response dari API
 */
async function updateArtikel(id, data) {
    // Ganti ke URL absolut jika backend beda domain
    const res = await fetch(`https://purwadaksina.space/api/artikel/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!res.ok) {
        throw new Error('Gagal update artikel');
    }
    
    return await res.json();
}

/**
 * Konversi JSON konten ke HTML untuk visual editor
 * @param {Array} konten - Array konten artikel
 * @returns {string} HTML string
 */
function jsonToHtml(konten) {
    let html = '';
    konten.forEach(item => {
        if (item.tipe === 'heading') {
            const tag = item.level === 2 ? 'h2' : 'h3';
            html += `<${tag}>${markupToHtml(item.isi)}</${tag}>`;
        } else if (item.tipe === 'paragraf') {
            html += `<p>${markupToHtml(item.isi)}</p>`;
        } else if (item.tipe === 'list') {
            const tag = item.format === 'bullet' ? 'ul' : 'ol';
            html += `<${tag}>`;
            item.items.forEach(li => {
                html += `<li>${markupToHtml(li)}</li>`;
            });
            html += `</${tag}>`;
        }
    });
    return html;
}

/**
 * Konversi custom markup tags ke HTML tags
 * @param {string} text - Text dengan custom markup
 * @returns {string} HTML string
 */
function markupToHtml(text) {
    return text
        .replace(/<bold>(.*?)<\/bold>/g, '<b>$1</b>')
        .replace(/<italic>(.*?)<\/italic>/g, '<i>$1</i>')
        .replace(/<underline>(.*?)<\/underline>/g, '<u>$1</u>')
        .replace(/<link href='(.*?)'>(.*?)<\/link>/g, '<a href="$1">$2</a>');
}

/**
 * Konversi HTML ke custom markup tags
 * @param {string} html - HTML string
 * @returns {string} Text dengan custom markup
 */
function processInlineFormats(html) {
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, ' ');
    text = text.replace(/<b\b[^>]*>(.*?)<\/b>/gis, '<bold>$1</bold>');
    text = text.replace(/<strong\b[^>]*>(.*?)<\/strong>/gis, '<bold>$1</bold>');
    text = text.replace(/<i\b[^>]*>(.*?)<\/i>/gis, '<italic>$1</italic>');
    text = text.replace(/<em\b[^>]*>(.*?)<\/em>/gis, '<italic>$1</italic>');
    text = text.replace(/<u\b[^>]*>(.*?)<\/u>/gis, '<underline>$1</underline>');
    text = text.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis, "<link href='$1'>$2</link>");
    text = text.replace(/<\/?span[^>]*>/gi, '');
    text = text.replace(/<(?!\/?(?:bold|italic|underline|link)(?:\s|>))[^>]+>/gi, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

/**
 * Konversi HTML visual editor ke JSON format
 * @param {HTMLElement} visualEditor - Element visual editor
 * @returns {Object} JSON object dengan struktur konten
 */
function convertToJSON(visualEditor) {
    const konten = [];
    const children = visualEditor.childNodes;

    children.forEach(node => {
        if (node.nodeType === 3) {
            const text = node.textContent.trim();
            if (text) {
                konten.push({ "tipe": "paragraf", "isi": text });
            }
        } else if (node.nodeType === 1) {
            const tagName = node.tagName.toLowerCase();
            
            if (tagName === 'h2') {
                konten.push({ "tipe": "heading", "level": 2, "isi": processInlineFormats(node.innerHTML) });
            } else if (tagName === 'h3') {
                konten.push({ "tipe": "heading", "level": 3, "isi": processInlineFormats(node.innerHTML) });
            } else if (tagName === 'p' || tagName === 'div') {
                const text = processInlineFormats(node.innerHTML);
                if (text.trim()) {
                    konten.push({ "tipe": "paragraf", "isi": text });
                }
            } else if (tagName === 'ul') {
                const items = Array.from(node.querySelectorAll('li'))
                    .map(li => processInlineFormats(li.innerHTML))
                    .filter(item => item.trim());
                if (items.length > 0) {
                    konten.push({ "tipe": "list", "format": "bullet", "items": items });
                }
            } else if (tagName === 'ol') {
                const items = Array.from(node.querySelectorAll('li'))
                    .map(li => processInlineFormats(li.innerHTML))
                    .filter(item => item.trim());
                if (items.length > 0) {
                    konten.push({ "tipe": "list", "format": "numbering", "items": items });
                }
            } else if (tagName !== 'br') {
                const text = processInlineFormats(node.innerHTML || node.textContent);
                if (text.trim()) {
                    konten.push({ "tipe": "paragraf", "isi": text });
                }
            }
        }
    });

    return { "konten": konten };
}

/**
 * Setup rich text editor toolbar
 * @param {NodeList} toolbarBtns - Toolbar buttons
 * @param {HTMLElement} visualEditor - Visual editor element
 * @param {Function} onUpdate - Callback saat konten berubah
 */
function setupToolbar(toolbarBtns, visualEditor, onUpdate) {
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            
            switch(format) {
                case 'bold':
                    document.execCommand('bold', false, null);
                    break;
                case 'italic':
                    document.execCommand('italic', false, null);
                    break;
                case 'underline':
                    document.execCommand('underline', false, null);
                    break;
                case 'link':
                    const url = prompt('Masukkan URL:', 'https://');
                    if (url) document.execCommand('createLink', false, url);
                    break;
                case 'h2':
                    document.execCommand('formatBlock', false, 'h2');
                    break;
                case 'h3':
                    document.execCommand('formatBlock', false, 'h3');
                    break;
                case 'paragraph':
                    document.execCommand('formatBlock', false, 'p');
                    break;
                case 'bullet':
                    document.execCommand('insertUnorderedList', false, null);
                    break;
                case 'number':
                    document.execCommand('insertOrderedList', false, null);
                    break;
            }
            
            visualEditor.focus();
            if (onUpdate) onUpdate();
        });
    });
}

/**
 * Tampilkan notifikasi
 * @param {string} message - Pesan notifikasi
 * @param {string} type - Tipe ('success' atau 'error')
 */
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}
