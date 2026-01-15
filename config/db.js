const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://arsh001356_db_user:KwHqOknnOR1REDRC@user.je5xlkv.mongodb.net/?retryWrites=true&w=majority&appName=user/yourDatabaseName', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;