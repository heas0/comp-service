require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const equipmentsRoutes = require('./routes/equipments');
const componentsRoutes = require('./routes/components');
const servicesRoutes = require('./routes/services');
const ordersRoutes = require('./routes/orders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/equipments', equipmentsRoutes);
app.use('/api/components', componentsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
