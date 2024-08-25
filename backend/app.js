const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api', tableRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
