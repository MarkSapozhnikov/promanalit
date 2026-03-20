import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";
import path from "path";

function generateId() {
  return Date.now().toString();
}

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    if (path.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
    }
  }
}));

// создаем папку если нет
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// настройка multer (сохраняем с оригинальным именем)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

const TELEGRAM_BOT_TOKEN = "8600708302:AAE_1XNRslzSIUetgTbZJg707kIS4rAYRcQ";
// const TELEGRAM_CHAT_ID = "608455063";
const TELEGRAM_CHAT_ID = "761200021";

const requests = {};

//
// 📩 Отправка файла в Telegram (ФИНАЛЬНЫЙ ПРАВИЛЬНЫЙ ВАРИАНТ)
//
app.post("/api/analysis-request", upload.single("file"), async (req, res) => {
  try {
    const id = generateId();

    requests[id] = {
      status: "pending",
      result: null,
    };

    const form = new FormData();

    form.append("chat_id", TELEGRAM_CHAT_ID);
    form.append("caption", `ID: ${id}`);

    // 🔥 КЛЮЧЕВОЙ ФИКС
    form.append(
      "document",
      fs.createReadStream(req.file.path),
      req.file.originalname || "file.pdf"
    );

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    res.json({ id });
  } catch (err) {
    console.error("❌ Telegram send error:", err.response?.data || err);
    res.status(500).json({ error: "Ошибка отправки" });
  }
});

//
// 📊 Проверка статуса
//
app.get("/api/status/:id", (req, res) => {
  res.json(requests[req.params.id] || {});
});

//
// 📥 Ручной ответ
//
app.post("/api/answer", upload.single("file"), (req, res) => {
  const id = req.body.id;

  requests[id] = {
    status: "done",
    result: `https://promanalit.onrender.com/uploads/${req.file.filename}`,
  };

  res.json({ ok: true });
});

//
// 🤖 Webhook от Telegram (прием ответа)
//
app.post("/telegram-webhook", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.reply_to_message) {
      return res.sendStatus(200);
    }

    const caption = message.reply_to_message.caption;
    const id = caption?.match(/ID: (.+)/)?.[1];
    if (!id) return res.sendStatus(200);

    const fileId = message.document?.file_id;
    if (!fileId) return res.sendStatus(200);

    // получаем путь файла
    const fileRes = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`,
      {
        params: { file_id: fileId },
      }
    );

    const filePath = fileRes.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // скачиваем файл
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const fileName = `result_${Date.now()}.pdf`;
    const fullPath = `uploads/${fileName}`;

    fs.writeFileSync(fullPath, response.data);

    // записываем результат
    requests[id] = {
      status: "done",
      result: `https://promanalit.onrender.com/uploads/${fileName}`,
    };

    res.sendStatus(200);
  } catch (e) {
    console.error("❌ Webhook error:", e);
    res.sendStatus(200);
  }
});

//
// 🧪 тест
//
app.get("/test", (req, res) => {
  res.send("NEW VERSION FINAL");
});

//
// 🚀 запуск
//
app.listen(PORT, () => console.log("🚀 Server started on", PORT));