//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from "cors"

//App config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1163358",
    key: "7ec30e5bc15a00393bf6",
    secret: "16a4ae6b32f36672047f",
    cluster: "ap2",
    useTLS: true
  });

//Middleware
app.use(express.json());
app.use(cors());

//Database config
const connection_url='mongodb+srv://pranjeet:Pranjeet@cluster0.censr.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change)=>{
        console.log("Change occured",change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
                {
                    name:messageDetails.user,
                    message:messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received:messageDetails.received,  
                }
            );
        }
        else{
            console.log("Error triggering Pusher");
        }
    });
});

//API routes
app.get("/",(req,res)=>res.status(200).send("hello world"));

app.get("/messages/sync", (req,res)=>{

    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new",(req,res)=>{
    const dbMessage=req.body;
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(201).send(data);
        }
    });
});

//Listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));