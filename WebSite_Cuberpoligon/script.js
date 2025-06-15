document.addEventListener('DOMContentLoaded', function() {
    // Меню и боковая панель
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            document.body.classList.toggle('menu-active');
            
            // Изменяем значок меню
            if (sidebar.classList.contains('open')) {
                menuToggle.innerHTML = '✕';
            } else {
                menuToggle.innerHTML = '☰';
            }
        });
        
        // Закрытие меню при клике вне его области
        document.addEventListener('click', function(event) {
            if (!sidebar.contains(event.target) && event.target !== menuToggle && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                document.body.classList.remove('menu-active');
                menuToggle.innerHTML = '☰';
            }
        });
    }
    
    // Анимация появления элементов при прокрутке
    const fadeElements = document.querySelectorAll('.fade-in');
    
    function checkFade() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 50) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Проверяем при загрузке страницы
    checkFade();
    
    // И при прокрутке
    window.addEventListener('scroll', checkFade);
    
    // Инициализация прогресс-баров
    const progressBars = document.querySelectorAll('.progress-fill');
    
    function animateProgressBars() {
        progressBars.forEach(bar => {
            const percentage = bar.getAttribute('data-percentage');
            bar.style.width = percentage + '%';
        });
    }
    
    // Настраиваем обсерверы для анимации при появлении в зоне видимости
    if ('IntersectionObserver' in window) {
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateProgressBars();
                    progressObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        const progressSection = document.querySelector('.progress-section');
        if (progressSection) {
            progressObserver.observe(progressSection);
        }
    } else {
        // Fallback для старых браузеров
        animateProgressBars();
    }
    
    // Обработка аккордеонов
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            const next = this.nextElementSibling;
            if (next && next.classList.contains('accordion-content')) {
                if (this.classList.contains('active')) {
                    next.style.display = 'block';
                } else {
                    next.style.display = 'none';
                }
            }
            // Закрыть другие аккордеоны в том же контейнере
            document.querySelectorAll('.accordion-header').forEach(other => {
                if (other !== this && other.parentNode === this.parentNode) {
                    other.classList.remove('active');
                    const n = other.nextElementSibling;
                    if (n && n.classList.contains('accordion-content')) n.style.display = 'none';
                }
            });
        });
        // По умолчанию скрываем все .accordion-content
        const next = header.nextElementSibling;
        if (next && next.classList.contains('accordion-content')) {
            next.style.display = 'none';
        }
    });
    
    // Добавляем анимацию печатающегося текста
    const typingElements = document.querySelectorAll('.typing-animation');
    
    typingElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.width = '0';
        
        let i = 0;
        const typingSpeed = 50; // скорость печати
        
        function typeWriter() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, typingSpeed);
            }
        }
        
        // Начинаем печатать через секунду после загрузки
        setTimeout(typeWriter, 1000);
    });
    
    // Интерактивные подсказки
    const tooltips = document.querySelectorAll('.info-tooltip');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.querySelector('.tooltip-text');
            if (tooltipText) {
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '1';
            }
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltipText = this.querySelector('.tooltip-text');
            if (tooltipText) {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            }
        });
    });
    
    // Плавный скролл для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Случайные блики на кнопках для эффекта "кибер"
    const buttons = document.querySelectorAll('.btn');
    
    function createGlowEffect(button) {
        // Создаем эффект блика
        const glow = document.createElement('span');
        glow.className = 'button-glow';
        button.appendChild(glow);
        
        // Анимируем блик
        glow.style.left = Math.random() * 100 + '%';
        glow.style.top = Math.random() * 100 + '%';
        glow.style.opacity = '1';
        
        setTimeout(() => {
            glow.remove();
        }, 1000);
    }
    
    buttons.forEach(button => {
        // Создаем случайные блики
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% шанс появления блика
                createGlowEffect(button);
            }
        }, 3000);
        
        // Добавляем блик при наведении
        button.addEventListener('mouseenter', () => {
            createGlowEffect(button);
        });
    });
    
    // Счетчики с анимацией
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // Продолжительность анимации в мс
        const step = Math.max(1, Math.floor(target / (duration / 16))); // 60fps
        
        let current = 0;
        const updateCounter = () => {
            current += step;
            if (current > target) {
                current = target;
            }
            counter.textContent = current;
            
            if (current < target) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        // Запускаем счетчик только когда элемент в зоне видимости
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(counter);
        } else {
            // Fallback для старых браузеров
            updateCounter();
        }
    });
    
    // Добавляем частицы на фон для кибер-эффекта
    if (document.querySelector('.particles-background')) {
        createParticles();
    }
    
    function createParticles() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const particlesContainer = document.querySelector('.particles-background');
        
        if (!particlesContainer) return;
        
        particlesContainer.appendChild(canvas);
        
        canvas.width = particlesContainer.offsetWidth;
        canvas.height = particlesContainer.offsetHeight;
        
        const particles = [];
        const particleCount = 100;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 - 0.5,
                color: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 255}, ${Math.random() * 0.5 + 0.2})`
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Движение частиц
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Границы
                if (p.x > canvas.width) p.x = 0;
                if (p.x < 0) p.x = canvas.width;
                if (p.y > canvas.height) p.y = 0;
                if (p.y < 0) p.y = canvas.height;
                
                // Соединяем ближайшие частицы линиями
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const distance = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(150, 150, 255, ${(100 - distance) / 500}`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            canvas.width = particlesContainer.offsetWidth;
            canvas.height = particlesContainer.offsetHeight;
        });
    }

    // Интерактивный ассистент для всех страниц

    (function() {
        // Тексты для разных страниц
        const pageHints = {
            'index.html': 'Это главная страница проекта «Киберполигон». Здесь вы найдёте краткое описание тематики и основные направления работы проекта.',
            'about.html': 'На этой странице рассказывается о целях, задачах и преимуществах проекта, а также о том, что такое кибербезопасность.',
            'team.html': 'Здесь представлена команда проекта и их роли. Познакомьтесь с участниками, которые создавали этот сайт.',
            'blog.html': 'В журнале отражены этапы работы над проектом и ключевые события. Следите за развитием проекта!',
            'resources.html': 'На этой странице собраны полезные ресурсы и ссылки для изучения кибербезопасности.'
        };

        // Определяем текущую страницу
        const path = window.location.pathname.split('/').pop();
        const hint = pageHints[path] || 'Добро пожаловать на сайт проекта Киберполигон!';

        // Создаём контейнер для ассистента
        const assistant = document.createElement('div');
        assistant.id = 'cyber-assistant';
        assistant.innerHTML = `
            <div class="assistant-avatar" title="Нажмите, чтобы узнать больше!"></div>
            <div class="assistant-bubble" style="display:none;"></div>
        `;
        document.body.appendChild(assistant);

        // Стили ассистента
        const style = document.createElement('style');
        style.innerHTML = `
            #cyber-assistant {
                position: fixed;
                right: 32px;
                bottom: 32px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .assistant-avatar {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #2e3a5a 60%, #4e6cff 100%);
                border-radius: 50%;
                box-shadow: 0 4px 16px rgba(30,40,80,0.25);
                background-image: url('images/assistant-face.svg');
                background-size: 60% 60%;
                background-repeat: no-repeat;
                background-position: center;
                cursor: pointer;
                transition: box-shadow 0.2s;
            }
            .assistant-avatar:hover {
                box-shadow: 0 8px 24px rgba(80,120,255,0.25);
            }
            .assistant-bubble {
                max-width: 320px;
                background: #23233a;
                color: #f0f0f0;
                border-radius: 16px 16px 4px 16px;
                box-shadow: 0 2px 12px rgba(30,40,80,0.18);
                padding: 18px 22px;
                margin-bottom: 12px;
                font-size: 1.05rem;
                line-height: 1.5;
                animation: assistant-bubble-in 0.25s;
            }
            @keyframes assistant-bubble-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 600px) {
                #cyber-assistant { right: 12px; bottom: 12px; }
                .assistant-bubble { max-width: 90vw; font-size: 0.98rem; }
            }
        `;
        document.head.appendChild(style);

        // Логика показа/скрытия сообщения
        const avatar = assistant.querySelector('.assistant-avatar');
        const bubble = assistant.querySelector('.assistant-bubble');
        let bubbleVisible = false;

        avatar.addEventListener('click', function() {
            bubbleVisible = !bubbleVisible;
            if (bubbleVisible) {
                bubble.textContent = hint;
                bubble.style.display = 'block';
            } else {
                bubble.style.display = 'none';
            }
        });

        // Скрывать сообщение при клике вне ассистента
        document.addEventListener('click', function(e) {
            if (!assistant.contains(e.target) && bubbleVisible) {
                bubble.style.display = 'none';
                bubbleVisible = false;
            }
        });
    })();

    // Fade-in анимация при прокрутке
    function fadeInOnScroll() {
        document.querySelectorAll('.fade-in').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 60) {
                el.classList.add('visible');
            }
        });
    }
    fadeInOnScroll();
    window.addEventListener('scroll', fadeInOnScroll);

    // Анимация подпрыгивания ассистента при первом появлении
    setTimeout(() => {
        const avatar = document.querySelector('.assistant-avatar');
        if (avatar) {
            avatar.animate([
                { transform: 'translateY(0)' },
                { transform: 'translateY(-18px)' },
                { transform: 'translateY(0)' }
            ], {
                duration: 700,
                easing: 'cubic-bezier(.4,0,.2,1)'
            });
        }
    }, 1200);
}); 