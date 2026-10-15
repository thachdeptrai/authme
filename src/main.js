/** Visitor interactions — zero frameworks, zero trackers. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Scroll position is a design accent, not a loading requirement.
  const progress = $('#page-progress');
  let scrollQueued = false;
  function paintScroll() {
    const total = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, scrollY / total * 100))}%`;
    scrollQueued = false;
  }
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(paintScroll);
  }, { passive: true });
  addEventListener('resize', paintScroll, { passive: true });
  paintScroll();

  const menu = $('#mobile-menu');
  const trigger = $('#menu-trigger');
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    trigger?.setAttribute('aria-expanded', String(open));
    trigger?.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    menu?.classList.toggle('is-open', open);
    if (menu) menu.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('.mobile-menu a')?.focus();
  }
  trigger?.addEventListener('click', () => setMenu(!menuOpen));
  $$('.mobile-menu a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (innerWidth > 900 && menuOpen) setMenu(false); });

  // Three strictly light colour moods; selection stays local to this tab.
  const skies = ['apricot', 'lavender', 'mint'];
  const labels = { apricot: 'trời màu đào', lavender: 'trời màu hoa cà', mint: 'trời màu bạc hà' };
  let saved;
  try { saved = sessionStorage.getItem('thach-sky'); } catch (_) { /* storage optional */ }
  if (skies.includes(saved)) document.body.dataset.sky = saved;
  const toast = $('#toast');
  let toastTimeout;
  function announce(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }
  $('#light-switch')?.addEventListener('click', () => {
    const next = skies[(skies.indexOf(document.body.dataset.sky) + 1) % skies.length];
    document.body.dataset.sky = next;
    try { sessionStorage.setItem('thach-sky', next); } catch (_) { /* storage optional */ }
    announce(`Đổi sang ${labels[next]} rồi đó ✳`);
  });

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver((entries, ob) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          ob.unobserve(entry.target);
        }
      });
    }, { threshold: .10, rootMargin: '0px 0px -25px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // An exhibition note for every world. Modal never discloses private systems.
  const projects = [
    {
      eyebrow: '01 / PLAY — GAME & IMAGINATION',
      title: 'Những thế giới để chơi',
      text: 'Từ tuổi thơ với Ngọc Rồng Online và Ninja School, mình đã bước xa hơn việc chỉ chơi: tìm hiểu client–server, chuyển đổi nền tảng, thử nghiệm với Unity, C# và LibGDX/Java. Mình thích cảm giác một hành động nhỏ trong game khiến cả thế giới phản hồi.',
      tags: ['Unity / C#', 'Java / LibGDX', 'Game client–server', 'Gameplay & UI'],
      link: null,
      linkText: null,
      note: 'Các dự án riêng tư không được công khai mã nguồn ở đây.'
    },
    {
      eyebrow: '02 / CREATE — APPS & EXPERIENCES',
      title: 'Ứng dụng có cảm xúc',
      text: 'Mình tạo ứng dụng với React Native, JavaScript và TypeScript — từ sản phẩm bán hàng, bất động sản đến những giao diện nhỏ nhưng có ích. Mình ưu tiên cảm giác sử dụng mượt, thao tác rõ ràng và những chi tiết khiến sản phẩm có cá tính.',
      tags: ['React Native', 'JavaScript / TypeScript', 'UX & Interaction', 'Firebase'],
      link: null,
      linkText: null,
      note: 'Đây là góc kể về hành trình, không phải danh sách sản phẩm thương mại.'
    },
    {
      eyebrow: '03 / ORGANIZE — OPERATIONS & CLARITY',
      title: 'Biến phức tạp thành rõ ràng',
      text: 'Ở VinFast, mình làm việc với dữ liệu kho và vận hành SAP EWM: theo dõi luồng hàng, kiểm soát sự chính xác, xử lý vấn đề phát sinh. Với Power BI và Excel, mình thích biến những bảng số liệu khó đọc thành một câu chuyện có thể ra quyết định.',
      tags: ['SAP EWM', 'Warehouse Operations', 'Power BI', 'Excel & Data'],
      link: null,
      linkText: null,
      note: 'Thông tin nội bộ và dữ liệu công ty không xuất hiện trên website.'
    },
    {
      eyebrow: '04 / DREAM — PERSONAL INTERNET',
      title: 'Những góc nhỏ trên Internet',
      text: 'Mình thích xây dựng web không chỉ để xem, mà để cảm nhận. Từ một món quà 20/10, thế giới đèn lồng Trung thu cho đến triển lãm số này — mỗi dự án là một cách khác để kể chuyện bằng chuyển động.',
      tags: ['Creative Web', 'Interactive Experiences', '3D Experiments', 'GitHub Pages'],
      link: 'https://github.com/thachdeptrai/20-10',
      linkText: 'Xem một dự án công khai ↗',
      note: 'Chỉ các repo đã công khai mới được liên kết.'
    }
  ];
  const dialog = document.createElement('dialog');
  dialog.className = 'project-dialog';
  dialog.setAttribute('aria-label', 'Chi tiết dự án');
  document.body.append(dialog);
  let lastFocused = null;
  function closeDialog() {
    if (dialog.open) dialog.close();
    lastFocused?.focus({ preventScroll: true });
  }
  function openProject(index) {
    const project = projects[index];
    if (!project) return;
    lastFocused = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'dialog-inside';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dialog-close';
    close.setAttribute('aria-label', 'Đóng thông tin dự án');
    close.textContent = '×';
    close.addEventListener('click', closeDialog);
    wrap.append(close);
    const eyebrow = document.createElement('p');
    eyebrow.className = 'dialog-eyebrow';
    eyebrow.textContent = project.eyebrow;
    const heading = document.createElement('h2');
    heading.textContent = project.title;
    const paragraph = document.createElement('p');
    paragraph.textContent = project.text;
    const tags = document.createElement('div');
    tags.className = 'dialog-tags';
    project.tags.forEach(tag => { const item = document.createElement('span'); item.textContent = tag; tags.append(item); });
    const note = document.createElement('p');
    note.className = 'dialog-note';
    note.textContent = project.note;
    wrap.append(eyebrow, heading, paragraph, tags);
    if (project.link) {
      const link = document.createElement('a');
      link.className = 'dialog-link';
      link.href = project.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = project.linkText;
      wrap.append(link);
    }
    wrap.append(note);
    dialog.replaceChildren(wrap);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      close.focus();
    } else {
      dialog.setAttribute('open', '');
      close.focus();
    }
  }
  $$('.project-card').forEach((card, index) => {
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Khám phá: ${projects[index]?.title ?? 'Dự án'}`);
    card.addEventListener('click', event => { if (!event.target.closest('a')) openProject(index); });
    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('a')) {
        event.preventDefault();
        openProject(index);
      }
    });
  });
  if (!reduceMotion.matches && matchMedia('(pointer:fine)').matches) {
    $$('.project-card').forEach(card => {
      const visual = $('.project-visual', card);
      card.addEventListener('pointermove', event => {
        const rect = visual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        visual.style.setProperty('--tiltx', `${(-y*5).toFixed(2)}deg`);
        visual.style.setProperty('--tilty', `${(x*5).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        visual.style.removeProperty('--tiltx');
        visual.style.removeProperty('--tilty');
      });
    });
  }
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => lastFocused?.focus({ preventScroll: true }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuOpen) setMenu(false); });

  // Small easter egg: an organic sculpture that invites play.
  const canvas = $('#world-canvas');
  let taps = 0;
  canvas?.addEventListener('click', () => {
    taps++;
    canvas.dispatchEvent(new CustomEvent('thach:reimagine', { detail: taps }));
    if (taps === 1) announce('Bạn vừa chạm vào một thế giới nhỏ ✳');
    else if (taps === 5) announce('Có những thứ đẹp nhất khi ta tò mò thêm chút nữa ♡');
  });
})();
