import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";
import axios from "axios";


function generateId() {
  return Date.now().toString();
}

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

const TELEGRAM_BOT_TOKEN = "8600708302:AAE_1XNRslzSIUetgTbZJg707kIS4rAYRcQ";
const TELEGRAM_CHAT_ID = "608455063";

const requests = {};

// 📩 Отправка файла в Telegram
app.post("/api/analysis-request", upload.single("file"), async (req, res) => {
  try {
    const id = generateId();

    requests[id] = {
      status: "pending",
      result: null,
    };

    await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
    {
        chat_id: TELEGRAM_CHAT_ID,
        caption: `ID: ${id}`,
        document: fs.createReadStream(req.file.path),
    },
    {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    }
    );

    res.json({ id });
  } catch (err) {
    console.error("❌ Telegram send error:", err);
    res.status(500).json({ error: "Ошибка отправки" });
  }
});

// 📊 Проверка статуса
app.get("/api/status/:id", (req, res) => {
  res.json(requests[req.params.id] || {});
});

// 📥 Ручной ответ (если будешь использовать)
app.post("/api/answer", upload.single("file"), (req, res) => {
  const id = req.body.id;

  requests[id] = {
    status: "done",
    result: `https://promanalit.onrender.com/uploads/${req.file.filename}`,
  };

  res.json({ ok: true });
});

// 🤖 Webhook от Telegram (ответ файлом)
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

    const fileName = `result_${Date.now()}.dat`;
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

app.get("/test", (req, res) => {
  res.send("NEW VERSION 123");
});

// 🚀 запуск
app.listen(PORT, () => console.log("🚀 Server started on", PORT));