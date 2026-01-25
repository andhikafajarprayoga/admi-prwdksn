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
            const level = item.level || 2;
            const text = convertCustomTagsToHTML(item.isi || '');
            html += `<h${level}>${text}</h${level}>`;
        } else if (item.tipe === 'paragraf') {
            const text = convertCustomTagsToHTML(item.isi || '');
            html += `<p>${text}</p>`;
        } else if (item.tipe === 'list') {
            const tag = item.format === 'numbering' ? 'ol' : 'ul';
            html += `<${tag}>`;
            (item.items || []).forEach(itemText => {
                const text = convertCustomTagsToHTML(itemText);
                html += `<li>${text}</li>`;
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
    
    // Remove <br> tags
    text = text.replace(/<br\s*\/?>/gi, ' ');
    
    // Convert bold to custom tag
    text = text.replace(/<(b|strong)\b[^>]*>(.*?)<\/\1>/gis, '<bold>$2</bold>');
    
    // Convert italic to custom tag
    text = text.replace(/<(i|em)\b[^>]*>(.*?)<\/\1>/gis, '<italic>$2</italic>');
    
    // Convert underline to custom tag
    text = text.replace(/<u\b[^>]*>(.*?)<\/u>/gis, '<underline>$1</underline>');
    
    // Convert links to custom tag format
    text = text.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis, "<link href='$1'>$2</link>");
    
    // Remove span tags but keep content
    text = text.replace(/<\/?span[^>]*>/gi, '');
    
    // Remove any remaining HTML tags except our custom ones
    text = text.replace(/<(?!\/?(?:bold|italic|underline|link)\b)[^>]+>/gi, '');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

/**
 * Konversi HTML visual editor ke JSON format
 * @param {HTMLElement} visualEditor - Element visual editor
 * @returns {Object} JSON object dengan struktur konten
 */
function convertToJSON(editor) {
    const konten = [];
    
    // Ambil semua child nodes langsung dari editor
    Array.from(editor.childNodes).forEach(node => {
        if (node.nodeType === 3) {
            // Text node
            const text = node.textContent.trim();
            if (text) {
                konten.push({
                    "tipe": "paragraf",
                    "isi": text
                });
            }
        } else if (node.nodeType === 1) {
            // Element node
            const tagName = node.tagName.toLowerCase();
            
            if (tagName === 'h2') {
                konten.push({
                    "tipe": "heading",
                    "level": 2,
                    "isi": processInlineFormats(node.innerHTML)
                });
            } else if (tagName === 'h3') {
                konten.push({
                    "tipe": "heading",
                    "level": 3,
                    "isi": processInlineFormats(node.innerHTML)
                });
            } else if (tagName === 'ul') {
                const items = [];
                node.querySelectorAll('li').forEach(li => {
                    const itemText = processInlineFormats(li.innerHTML);
                    if (itemText.trim()) {
                        items.push(itemText);
                    }
                });
                if (items.length > 0) {
                    konten.push({
                        "tipe": "list",
                        "format": "bullet",
                        "items": items
                    });
                }
            } else if (tagName === 'ol') {
                const items = [];
                node.querySelectorAll('li').forEach(li => {
                    const itemText = processInlineFormats(li.innerHTML);
                    if (itemText.trim()) {
                        items.push(itemText);
                    }
                });
                if (items.length > 0) {
                    konten.push({
                        "tipe": "list",
                        "format": "numbering",
                        "items": items
                    });
                }
            } else if (tagName === 'p') {
                const text = processInlineFormats(node.innerHTML);
                if (text.trim()) {
                    konten.push({
                        "tipe": "paragraf",
                        "isi": text
                    });
                }
            } else if (tagName === 'div') {
                // Check if div contains ul or ol
                const ul = node.querySelector('ul');
                const ol = node.querySelector('ol');
                
                if (ul) {
                    const items = [];
                    ul.querySelectorAll('li').forEach(li => {
                        const itemText = processInlineFormats(li.innerHTML);
                        if (itemText.trim()) {
                            items.push(itemText);
                        }
                    });
                    if (items.length > 0) {
                        konten.push({
                            "tipe": "list",
                            "format": "bullet",
                            "items": items
                        });
                    }
                } else if (ol) {
                    const items = [];
                    ol.querySelectorAll('li').forEach(li => {
                        const itemText = processInlineFormats(li.innerHTML);
                        if (itemText.trim()) {
                            items.push(itemText);
                        }
                    });
                    if (items.length > 0) {
                        konten.push({
                            "tipe": "list",
                            "format": "numbering",
                            "items": items
                        });
                    }
                } else {
                    // Regular div with text
                    const text = processInlineFormats(node.innerHTML);
                    if (text.trim()) {
                        konten.push({
                            "tipe": "paragraf",
                            "isi": text
                        });
                    }
                }
            } else if (tagName !== 'br') {
                // Fallback untuk tag lain
                const text = processInlineFormats(node.innerHTML || node.textContent);
                if (text.trim()) {
                    konten.push({
                        "tipe": "paragraf",
                        "isi": text
                    });
                }
            }
        }
    });

    return konten;
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

// Convert custom tags to HTML for display in editor
function convertCustomTagsToHTML(text) {
    if (!text) return text;
    
    text = text.replace(/<bold>(.*?)<\/bold>/g, '<strong>$1</strong>');
    text = text.replace(/<italic>(.*?)<\/italic>/g, '<em>$1</em>');
    text = text.replace(/<underline>(.*?)<\/underline>/g, '<u>$1</u>');
    text = text.replace(/<link href=['"]([^'"]+)['"]>(.*?)<\/link>/g, '<a href="$1">$2</a>');
    
    return text;
}
