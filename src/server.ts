import cors from 'cors';
import express from 'express';
import { router } from './route';

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
