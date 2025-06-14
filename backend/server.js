import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from '../backend/routes/productRoutes.js'
import {sql} from '../backend/config/db.js'
import {aj} from '../backend/lib/arcjet.js'
import path from 'path'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000
const __dirname = path.resolve()

app.use(express.json())
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity, adjust as needed
}))
app.use(morgan('dev'))
app.use(cors())

app.use(async (req, res, next) => {
    try {
        const decision = await aj.protect(req, {
            requested: 1
        }) 
        if(decision.isDenied()) {
            if(decision.reason.isRateLimit()) {
                res.status(429).json({
                    error: "Too many Requests"
                })
            } else if(decision.reason.isBot()) {
                res.status(403).json({error: "Bot access denied "})
            } else {
                res.status(403).json({error: "Forbidden"})
            }
            return
        }

        if(decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            res.status(403).json({error: "Spoofed bot detected"})
        }

        next()

    } catch (e) {
        console.log("Arcjet", e) 
        next(e)
    }
})

app.use('/api/products', productRoutes)


if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/frontend/dist')))
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
    })
}

async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(225) NOT NULL,
                image VARCHAR(225) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `

        console.log('Database initialize successfully')
    } catch (err) {
        console.error('error initDB', err)
    }
}

initDB().then(()=> {
    app.listen(PORT, ()=> {
    console.log(`server is running on port ${PORT}`)
})
})
