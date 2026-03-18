import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";

function generateId() {
  return Date.now().toString();
}

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

const BOT_TOKEN = "8600708302:AAE_1XNRslzSIUetgTbZJg707kIS4rAYRcQ";
const CHAT_ID = "608455063";

const requests = {};

app.post("/api/analysis-request", upload.single("file"), async (req, res) => {
  try {
    const id = generateId();

    requests[id] = {
      status: "pending",
      result: null,
    };

    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("document", fs.createReadStream(req.file.path));
    form.append("caption", `ID: ${id}`);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: form,
    });

    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

app.get("/api/status/:id", (req, res) => {
  res.json(requests[req.params.id] || {});
});

app.post("/api/answer", upload.single("file"), (req, res) => {
  const id = req.body.id;

  requests[id] = {
    status: "done",
    result: `http://localhost:3001/uploads/${req.file.filename}`,
  };

  res.json({ ok: true });
});

app.listen(3001, () => console.log("🚀 Server started"));

app.post("/telegram-webhook", upload.single("document"), async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.reply_to_message) return res.sendStatus(200);

    const caption = message.reply_to_message.caption;

    // достаем ID
    const id = caption?.match(/ID: (.+)/)?.[1];
    if (!id) return res.sendStatus(200);

    // файл от тебя
    const fileId = message.document.file_id;

    // получаем файл от Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // скачиваем файл
    const fileStream = await fetch(fileUrl);
    const fileName = `result_${Date.now()}.dat`;
    const fileFullPath = `uploads/${fileName}`;

    const buffer = await fileStream.arrayBuffer();
    fs.writeFileSync(fileFullPath, Buffer.from(buffer));

    // сохраняем результат
    requests[id] = {
      status: "done",
      result: `http://localhost:3001/${fileFullPath}`,
    };

    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});