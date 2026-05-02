import {createApp} from './src/app.js';
import {connectToDatabase} from './src/config/db.config.js';
import {env} from './src/config/env.config.js';
const start = async ()=>{
    await connectToDatabase(env.MONGO_URI);
    const app = createApp();
    app.listen(env.PORT,()=>{
        console.log(`Server is running on port ${env.PORT}`);
    });
}

start().catch((err)=>{
    console.log("Error starting the server: ", err);
    process.exit(1);
})