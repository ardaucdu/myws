window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            const preloader = document.getElementById('preloader');
            preloader.classList.add('shrink');
            setTimeout(function() {
                preloader.classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
            }, 500);
        }, 3000);
    });
    const terminal = document.getElementById('draggable-terminal');
    const topbar = document.getElementById('terminal-topbar');
    let isFullscreen = false;
    topbar.addEventListener('dblclick', function(e) {
        e.preventDefault();
        toggleFullscreen();
    });
    function toggleFullscreen() {
        if (isFullscreen) {
            terminal.classList.add('shrink');
            isFullscreen = false;
        } else {
            terminal.classList.remove('shrink');
            isFullscreen = true;
        }
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isFullscreen) {
            toggleFullscreen();
        }
    });
    const ardaText = 'ARDA UÇDU';
    let ardaIndex = 0;
    let ardaDone = false;
    document.addEventListener('keydown', function(e) {
        if (ardaDone) return;
        const komutSpan = document.getElementById('arda-komut');
        if (e.key === 'Enter') {
            ardaDone = true;
            return;
        }
        if (ardaIndex < ardaText.length) {
            komutSpan.textContent += ardaText[ardaIndex];
            ardaIndex++;
        }
        if (ardaIndex > 3 && ardaIndex < ardaText.length) {
            komutSpan.textContent = ardaText;
            ardaDone = true;
        }
        if (ardaIndex === ardaText.length) {
            ardaDone = true;
        }
    });
    const GITHUB_REPO = 'ardaucdu/myws'; 
    const blogContainer = document.getElementById('blog-list-container');
    const blogModal = document.getElementById('blog-modal');
    const blogContent = document.getElementById('blog-content');
    const blogModalClose = document.getElementById('blog-modal-close');
    const blogModalTitle = document.getElementById('blog-modal-title');
    async function openBlog(url, filename) {
        blogModalTitle.textContent = filename;
        blogModal.classList.add('flex-display'); blogModal.classList.remove('hidden');
        blogContent.innerHTML = '<i>Yükleniyor...</i>';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Dosya okunamadı.");
            const mdText = await response.text();
            const rawHtml = marked.parse(mdText);
            blogContent.innerHTML = DOMPurify.sanitize(rawHtml);
        } catch(e) {
            blogContent.innerHTML = '<span style="color:#ff5555;">Hata: Blog yazısı yüklenemedi.</span>';
        }
    }
    blogModalClose.addEventListener('click', () => {
        blogModal.classList.add('hidden'); blogModal.classList.remove('flex-display');
        blogContent.innerHTML = '';
    });
    async function loadBlogs() {
        try {
            const response = await fetch('blogs.json');
            if (!response.ok) {
                throw new Error("blogs.json okunamadı");
            }
            const data = await response.json();
            const mdFiles = data.filter(file => file.name.endsWith('.md'));
            if (mdFiles.length === 0) {
                blogContainer.innerHTML = 'Hiç blog yazısı (.md) bulunamadı.';
                return;
            }
            let htmlList = 'total ' + mdFiles.length + '\n';
            mdFiles.forEach(file => {
                const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                const safeUrl = encodeURI(file.download_url);
                const safeName = file.name.replace(/[<>"'&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'})[c]);
                htmlList += `-rw-r--r-- 1 root root  ----- ${date} <a href="#" class="blog-link blog-link-item" data-url="${safeUrl}" data-name="${safeName}">${safeName}</a>\n`;
            });
            blogContainer.innerHTML = htmlList;
            blogContainer.addEventListener('click', function(e) {
                const link = e.target.closest('.blog-link');
                if (link) {
                    e.preventDefault();
                    openBlog(decodeURI(link.dataset.url), link.dataset.name);
                }
            });

            // Deep Link Logic
            if (window.location.hash) {
                const hashVal = decodeURIComponent(window.location.hash.substring(1));
                const targetLink = document.querySelector(`.blog-link[data-name="${CSS.escape(hashVal)}"]`);
                if (targetLink) {
                    openBlog(decodeURI(targetLink.dataset.url), targetLink.dataset.name);
                }
            }

        } catch (error) {
            console.warn(error.message);
            blogContainer.innerHTML = `total 1
-rw-r--r-- 1 root root  12345 Local Test <a href="#" class="blog-link blog-link-item" data-url="blogs/ornek-blog.md" data-name="ornek-blog.md">ornek-blog.md</a>`;
            blogContainer.addEventListener('click', function(e) {
                const link = e.target.closest('.blog-link');
                if (link) {
                    e.preventDefault();
                    openBlog(decodeURI(link.dataset.url), link.dataset.name);
                }
            });

            // Deep Link Logic
            if (window.location.hash) {
                const hashVal = decodeURIComponent(window.location.hash.substring(1));
                const targetLink = document.querySelector(`.blog-link[data-name="${CSS.escape(hashVal)}"]`);
                if (targetLink) {
                    openBlog(decodeURI(targetLink.dataset.url), targetLink.dataset.name);
                }
            }

        }
    }
    loadBlogs();
