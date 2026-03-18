import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";
import axios from "axios";
import path from "path";

function generateId() {
  return Date.now().toString();
}

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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

const TELEGRAM_BOT_TOKEN = "ТВОЙ_НОВЫЙ_ТОКЕН"; // ⚠️ обязательно замени
const TELEGRAM_CHAT_ID = "608455063";

const requests = {};

//
// 📩 Отправка файла в Telegram
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
    form.append("document", fs.createReadStream(req.file.path), {
      filename: req.file.originalname || "file.pdf",
      contentType: "application/pdf",
    });

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      form,
      {
        headers: form.getHeaders(),
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
// 📥 Ручной ответ (если нужно)
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
// 🤖 Webhook от Telegram
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
    const fileRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json();

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // скачиваем файл
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // сохраняем как PDF
    const fileName = `result_${Date.now()}.pdf`;
    const fullPath = `uploads/${fileName}`;

    fs.writeFileSync(fullPath, Buffer.from(buffer));

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
  res.send("NEW VERSION FIXED PDF");
});

//
// 🚀 запуск
//
app.listen(PORT, () => console.log("🚀 Server started on", PORT));