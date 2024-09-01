const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors
const loginRoutes = require('./routes/login');
const refreshTokenRoutes = require('./routes/auth');
const tableRoutes = require('./routes/table');
const tablesRoutes = require('./routes/tables');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const verifyToken = require('./middleware/verifyToken');

require('dotenv').config();

const app = express();

// Swagger configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Sample Task API documentation',
            version: '1.0.0',
            description: 'API Documentation',
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:3000', // Change this to your API base URL
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to your API routes files
};

// Conditional CORS configuration
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || origin === 'null' || origin === 'http://localhost:3000') {
                // Allow requests with null origin, for local file access
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }));
} else {
    // Restrict CORS for production
    app.use(cors({
        origin: process.env.FRONTEND_URL,
        methods: 'GET,POST,PUT,DELETE',
        credentials: true
    }));
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use((req, res, next) => {
    logger.info(`CORS Request: ${req.method} ${req.originalUrl}`);
    next();
});

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use('/api', loginRoutes);

app.use('/api', verifyToken);

app.use('/api', refreshTokenRoutes);
app.use('/api', tableRoutes);
app.use('/api', tablesRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
