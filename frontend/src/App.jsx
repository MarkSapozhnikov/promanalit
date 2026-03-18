import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, UploadCloud, FileCheck2 } from "lucide-react";

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
      <div className="card">
        <h1>ПромАналит</h1>
        <p className="subtitle">
          Анализ чертежей металлоконструкций
        </p>

        <div
          className={`dropzone ${file ? "active" : ""}`}
          onClick={() => inputRef.current.click()}
        >
          <UploadCloud size={42} />
          <p>{file ? file.name : "Перетащите или нажмите для загрузки"}</p>
          <span>PDF, DWG, DXF до 25MB</span>

          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {stage === "idle" && (
          <button className="main-btn" onClick={send} disabled={!valid}>
            Отправить на анализ
          </button>
        )}

        {stage === "loading" && (
          <div className="loader">
            <Loader2 className="spin" />
            <p>Анализируем чертёж...</p>
          </div>
        )}

        {stage === "done" && (
          <div className="result">
            <FileCheck2 size={42} />
            <p>Анализ готов</p>
            <a href={result} target="_blank" className="download">
              Скачать результат
            </a>
          </div>
        )}
      </div>
    </div>
  );
}