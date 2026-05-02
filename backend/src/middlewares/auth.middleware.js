import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";
import {userModel} from "../models/user.model.js";


export const requireAuth = async (req,res,next)=>{
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

    if(!token){
        return res.status(401).json({
            message:"Authentication required"
        })
    }

    try{
        const payload = jwt.verify(token,env.JWT_SECRET);
        const user = await userModel.findById(payload.sub);
        if(!user){
            return res.status(401).json({
                message:"User not found"
            })
        }
        req.user = user;
        next();
    }catch(err){
        return res.status(401).json({
            message:"Invalid or expired token"
        })
    }
}