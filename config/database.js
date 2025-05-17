const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'knight',
    database: process.env.DB_NAME || 'assignment_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

module.exports = {
    dbConfig
}; 