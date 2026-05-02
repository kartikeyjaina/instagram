import mongoose from 'mongoose';

export const connectToDatabase = async (mongoUri)=>{
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
}