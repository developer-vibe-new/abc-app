const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderName = req.body.typeName;
        const dir = path.join(__dirname, '../../public', folderName);
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop();
        const filename = `${Date.now()}.${ext}`;
        cb(null, filename);
    }
});

exports.upload = multer({ storage: storage });

