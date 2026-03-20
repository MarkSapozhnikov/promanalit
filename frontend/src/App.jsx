import { useEffect, useMemo, useRef, useState } from "react";
import { 
  Loader2, UploadCloud, FileCheck2, 
  Shield, Zap, Target, Users, 
  ChevronRight, Mail, Phone, MapPin,
  Github, Linkedin, Twitter
} from "lucide-react";

const MAX_FILE_SIZE_MB = 25;

function validateFile(file) {
  if (!file) return false;
  return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
}

async function submit(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://promanalit.onrender.com/api/analysis-request", {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export default function App() {
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle");
  const [requestId, setRequestId] = useState(null);
  const [result, setResult] = useState(null);

  const valid = useMemo(() => validateFile(file), [file]);

  const send = async () => {
    if (!valid) return;
    setStage("loading");
    const data = await submit(file);
    setRequestId(data.id);
  };

  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `https://promanalit.onrender.com/api/status/${requestId}`
      );
      const data = await res.json();

      if (data.status === "done") {
        setResult(data.result);
        setStage("done");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [requestId]);

  return (
    <div className="app">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={16} />
              <span>AI-анализ чертежей</span>
            </div>
            <h1 className="hero-title">
              ПроМонолит
              <span className="hero-title-gradient">.</span>
            </h1>
            <p className="hero-description">
              Автоматизированный анализ чертежей ж/б конструкций с использованием передовых технологий компьютерного зрения и последующее составление инструкций для работы. Быстро, точно, без лишней рутины.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">98%</div>
                <div className="stat-label">Точность анализа</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">5x</div>
                <div className="stat-label">Ускорение проверки</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Доступность</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="card">
              <div className="card-header">
                <h3>Загрузите чертеж</h3>
                <p>PDF, DWG или DXF до 25MB</p>
              </div>
              
              <div 
                className={`dropzone ${file ? 'active' : ''}`} 
                onClick={() => inputRef.current.click()}
              >
                <UploadCloud size={48} />
                <p className="dropzone-text">
                  {file ? file.name : "Нажмите для загрузки или перетащите файл"}
                </p>
                {!file && <span className="dropzone-hint">Поддерживаемые форматы: PDF, DWG, DXF</span>}
                
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.dwg,.dxf"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>

              {stage === "idle" && file && (
                <div className="file-info">
                  <FileCheck2 size={20} />
                  <span>Файл загружен: {file.name}</span>
                </div>
              )}

              {stage === "idle" && (
                <button 
                  className="main-btn" 
                  onClick={send} 
                  disabled={!valid}
                >
                  {!file ? 'Выберите файл' : 'Отправить на анализ'}
                  {file && <ChevronRight size={20} />}
                </button>
              )}

              {stage === "loading" && (
                <div className="loader">
                  <Loader2 className="spin" size={48} />
                  <div className="loader-text">
                    <h4>Идет анализ...</h4>
                    <p>По заверению анализа вы сможете скачать результат</p>
                  </div>
                </div>
              )}

              {stage === "done" && (
                <div className="result">
                  <div className="result-icon">
                    <FileCheck2 size={48} />
                  </div>
                  <div className="result-text">
                    <h4>Анализ завершен!</h4>
                    <p>Ваш файл готов к скачиванию</p>
                  </div>
                  <a href={result} target="_blank" className="download-btn" rel="noreferrer">
                    Скачать результат
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Почему выбирают нас</h2>
            <p>Современные решения для анализа чертежей</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Точность анализа</h3>
              <p>Нейросети обеспечивают высокую точность распознавания чертежей</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>Быстрый результат</h3>
              <p>Получите готовый анализ за считанные секунды вместо часов ручной работы</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Target size={32} />
              </div>
              <h3>Минимум ошибок</h3>
              <p>Автоматизация исключает человеческий фактор при проверке чертежей</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Как это работает</h2>
            <p>Три простых шага к результату</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Загрузка</h3>
              <p>Загрузите чертеж изделия в любом поддерживаемом формате</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Анализ</h3>
              <p>Наш AI проводит технический разбор документации и выявляет ключевые параметры</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Результат</h3>
              <p>Скачайте готовую инструкцию по сборке ж/б изделия с советами и рекомендациями</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT COMPANY */}
      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <div className="section-header left">
                <h2>О компании ПроМонолит</h2>
              </div>
              <p className="about-text">
                ПроМонолит — инновационный сервис анализа инженерной документации для последующего составления инструкций по сборке. Мы объединили опыт профессиональных инженеров с передовыми технологиями искусственного интеллекта.
              </p>
              <p className="about-text">
                Наша миссия — ускорить сборку ж/б изделий, снизить количество ошибок и повысить эффективность работы низкоквалифицированных сотрудников.
              </p>
            
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-large">10K+</div>
                <div>Проанализировано чертежей</div>
              </div>
              <div className="stat-card">
                <div className="stat-large">98%</div>
                <div>Точность распознавания</div>
              </div>
              <div className="stat-card">
                <div className="stat-large">5 мин</div>
                <div>Длительность анализа</div>
              </div>
              <div className="stat-card">
                <div className="stat-large">24/7</div>
                <div>Поддержка клиентов</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-info">
              <h3>ПроМонолит</h3>
              <p>Автоматизированный анализ чертежей металлоконструкций</p>
              <div className="social-links">
                <a href="#" aria-label="GitHub"><Github size={20} /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              </div>
            </div>
            
            <div className="footer-links">
              <h4>Контакты</h4>
              <ul>
                <li>
                  <Mail size={16} />
                  <span>info@promonolit.ru</span>
                </li>
                <li>
                  <Phone size={16} />
                  <span>+7 (915) 196-81-50</span>
                </li>
                <li>
                  <MapPin size={16} />
                  <span>Москва, ул. Инженерная, 15</span>
                </li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>Документы</h4>
              <ul>
                <li><a href="#">Пользовательское соглашение</a></li>
                <li><a href="#">Политика конфиденциальности</a></li>
                <li><a href="#">Договор оферты</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} ПроМонолит. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}