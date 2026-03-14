import "dotenv/config";
import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const getMongoUri = () => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    const password = process.env.MONGODB_PASSWORD;
    if (!password) {
        throw new Error("Missing MongoDB config. Set MONGODB_URI or MONGODB_PASSWORD in backend/.env");
    }

    return `mongodb+srv://riyasrivastava9555_db_user:${password}@cluster0.3jvvp2x.mongodb.net/?appName=Cluster0`;
};

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(getMongoUri());
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${app.get("port")}`);
        });
    } catch (error) {
        console.error("Failed to start backend:", error.message);
        process.exit(1);
    }
};



start();